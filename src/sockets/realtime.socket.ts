import { IncomingMessage, Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';

import { serverConfig, socketConfig } from '../config';
import { store } from '../store/in-memory.store';
import {
  ClientMessage,
  DoctorUser,
  ServerMessage,
  User,
} from '../types';
import {
  verifyAccessToken,
  setDoctorAvailability,
} from '../services/auth.service';
import {
  notifyUserListChanged,
  registerNotifier,
} from './notifier';

type ActiveCall = {
  doctorId: string;
  patientId: string;
};

export class RealtimeServer {
  private readonly wss: WebSocketServer;
  private readonly connections = new Map<string, WebSocket>();
  private readonly activeCalls = new Map<string, ActiveCall>();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({
      server,
      path: socketConfig.path,
    });

    registerNotifier(this);

    this.wss.on('connection', (socket, request) => {
      this.onConnection(socket, request).catch((error) => {
        console.error('WebSocket connection error', error);
        socket.close(1008, 'Unauthorized');
      });
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error', error);
    });
  }

  broadcastUserList(): void {
    const payload: ServerMessage = {
      type: 'users-update',
      users: store.toPublicProfiles(),
    };
    this.broadcast(payload);
  }

  private broadcast(message: ServerMessage): void {
    const serialized = JSON.stringify(message);
    for (const socket of this.connections.values()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(serialized);
      }
    }
  }

  private async onConnection(socket: WebSocket, request: IncomingMessage): Promise<void> {
    const token = this.extractToken(request);
    if (!token) {
      throw new Error('Missing token');
    }

    const payload = verifyAccessToken(token);
    const user = store.getUserById(payload.sub);

    if (!user) {
      throw new Error('User not found for token');
    }

    const existingSocket = this.connections.get(user.id);
    if (existingSocket && existingSocket.readyState === WebSocket.OPEN) {
      existingSocket.close(4000, 'Another session connected');
    }

    this.connections.set(user.id, socket);
    store.markConnected(user.id);

    const initialMessage: ServerMessage = {
      type: 'users-update',
      users: store.toPublicProfiles(),
    };
    socket.send(JSON.stringify(initialMessage));

    this.broadcastUserList();

    socket.on('message', (raw) => {
      this.onMessage(user, raw.toString());
    });

    socket.on('close', () => {
      this.onDisconnect(user);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error for user', user.id, error);
    });
  }

  private extractToken(request: IncomingMessage): string | null {
    const authHeader = request.headers['sec-websocket-protocol'];
    if (authHeader) {
      const parts = authHeader.split(',').map((part) => part.trim());
      const bearer = parts.find((part) => part.toLowerCase().startsWith('bearer '));
      if (bearer) {
        return bearer.slice('bearer '.length);
      }
    }

    if (request.url) {
      const url = new URL(request.url, `http://localhost:${serverConfig.port}`);
      const token = url.searchParams.get('token');
      if (token) {
        return token;
      }
    }

    return null;
  }

  private onMessage(user: User, raw: string): void {
    let parsed: ClientMessage;

    try {
      parsed = JSON.parse(raw) as ClientMessage;
    } catch {
      this.sendTo(user.id, {
        type: 'error',
        message: 'Invalid message format',
      });
      return;
    }

    switch (parsed.type) {
      case 'chat':
        this.handleChatMessage(user, parsed);
        break;
      case 'webrtc-offer':
      case 'webrtc-answer':
      case 'webrtc-ice-candidate':
        this.forwardSignal(user, parsed);
        break;
      case 'call-initiate':
        this.handleCallInitiate(user, parsed);
        break;
      case 'call-accept':
      case 'call-reject':
      case 'call-end':
        this.handleCallEvent(user, parsed);
        break;
      default:
        this.sendTo(user.id, { type: 'error', message: 'Unsupported message type' });
    }
  }

  private handleChatMessage(
    user: User,
    message: Extract<ClientMessage, { type: 'chat' }>,
  ): void {
    const receiver = store.getUserById(message.to);

    if (!receiver) {
      this.sendTo(user.id, { type: 'error', message: 'Recipient not found', context: 'chat' });
      return;
    }

    const payload: ServerMessage = {
      type: 'chat',
      from: user.id,
      message: message.message,
      sentAt: new Date().toISOString(),
    };

    this.sendTo(receiver.id, payload);
    if (receiver.id !== user.id) {
      this.sendTo(user.id, payload);
    }
  }

  private forwardSignal(
    user: User,
    message: Extract<ClientMessage, { type: 'webrtc-offer' | 'webrtc-answer' | 'webrtc-ice-candidate' }>,
  ): void {
    const receiver = store.getUserById(message.to);
    if (!receiver) {
      this.sendTo(user.id, { type: 'error', message: 'Recipient not found', context: message.type });
      return;
    }

    const payload: ServerMessage = {
      type: message.type,
      from: user.id,
      payload: message.payload,
    };

    this.sendTo(receiver.id, payload);
  }

  private handleCallInitiate(
    user: User,
    message: Extract<ClientMessage, { type: 'call-initiate' }>,
  ): void {
    const recipient = store.getUserById(message.to);
    if (!recipient) {
      this.sendTo(user.id, { type: 'error', message: 'Recipient not found', context: 'call-initiate' });
      return;
    }

    if (user.role === 'PATIENT' && recipient.role === 'DOCTOR') {
      const doctor = recipient as DoctorUser;
      if (doctor.availability !== 'ONLINE') {
        this.sendTo(user.id, {
          type: 'error',
          message: 'Doctor is not available',
          context: 'call-initiate',
        });
        return;
      }

      setDoctorAvailability(doctor.id, 'BUSY');
      this.trackCall(doctor.id, user.id);
    } else if (user.role === 'DOCTOR' && recipient.role === 'PATIENT') {
      const doctor = user as DoctorUser;
      if (doctor.availability !== 'ONLINE') {
        this.sendTo(user.id, {
          type: 'error',
          message: 'You must be available to initiate calls',
          context: 'call-initiate',
        });
        return;
      }

      setDoctorAvailability(doctor.id, 'BUSY');
      this.trackCall(user.id, recipient.id);
    } else {
      this.sendTo(user.id, {
        type: 'error',
        message: 'Calls can only be established between a doctor and a patient',
        context: 'call-initiate',
      });
      return;
    }

    const callMessage: ServerMessage = {
      type: 'call-initiate',
      from: user.id,
    };
    this.sendTo(recipient.id, callMessage);
    this.sendTo(user.id, callMessage);

    this.broadcastUserList();
  }

  private handleCallEvent(
    user: User,
    message: Extract<ClientMessage, { type: 'call-accept' | 'call-reject' | 'call-end' }>,
  ): void {
    const counterpart = this.getCallCounterpart(user.id);

    if (!counterpart) {
      this.sendTo(user.id, { type: 'error', message: 'No active call found', context: message.type });
      return;
    }

    switch (message.type) {
      case 'call-accept':
        this.sendTo(counterpart, { type: 'call-accept', from: user.id });
        break;
      case 'call-reject':
        this.sendTo(counterpart, { type: 'call-reject', from: user.id });
        this.clearActiveCall(counterpart, user.id);
        break;
      case 'call-end':
        this.sendTo(counterpart, { type: 'call-end', from: user.id });
        this.clearActiveCall(counterpart, user.id);
        break;
      default:
        break;
    }
  }

  private onDisconnect(user: User): void {
    this.connections.delete(user.id);
    store.markDisconnected(user.id);

    const counterpart = this.getCallCounterpart(user.id);
    if (counterpart) {
      this.sendTo(counterpart, { type: 'call-end', from: user.id });
      this.clearActiveCall(counterpart, user.id);
    }

    this.broadcastUserList();
  }

  private sendTo(userId: string, message: ServerMessage): void {
    const socket = this.connections.get(userId);
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }
    socket.send(JSON.stringify(message));
  }

  private trackCall(doctorId: string, patientId: string): void {
    const call: ActiveCall = { doctorId, patientId };
    this.activeCalls.set(doctorId, call);
    this.activeCalls.set(patientId, call);
  }

  private getCallCounterpart(userId: string): string | null {
    const call = this.activeCalls.get(userId);
    if (!call) {
      return null;
    }

    return call.doctorId === userId ? call.patientId : call.doctorId;
  }

  private clearActiveCall(userA: string, userB: string): void {
    const call = this.activeCalls.get(userA);
    if (!call) {
      return;
    }

    this.activeCalls.delete(call.doctorId);
    this.activeCalls.delete(call.patientId);

    const doctor = store.getUserById(call.doctorId);
    if (doctor && doctor.role === 'DOCTOR') {
      setDoctorAvailability(doctor.id, 'ONLINE');
    }

    this.broadcastUserList();
  }
}

export function createRealtimeServer(server: HttpServer): RealtimeServer {
  const realtime = new RealtimeServer(server);
  notifyUserListChanged();
  return realtime;
}

