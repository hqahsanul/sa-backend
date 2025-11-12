# Sanatan Ayurveda Backend

Backend API for a real-time telemedicine application. Built with Node.js, Express, and TypeScript. Supports user authentication, doctor availability management, real-time chat, and WebRTC signaling for audio calls.

## Tech Stack

- **Node.js** with **Express** for the REST API
- **TypeScript** for type safety
- **WebSockets** (ws library) for real-time communication
- **JWT** for authentication
- In-memory storage (no database required for this project)

## Prerequisites

Make sure you have Node.js installed (v16). You can check your version with:

```bash
node --version
```

## Setup

1. Navigate to the backend directory:
```bash
cd sa-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory (optional - defaults are provided):
```env
PORT=4000
API_VERSION=v1
JWT_SECRET=your-secret-key-here
JWT_EXPIRY_SECONDS=28800
WS_PATH=/ws
NODE_ENV=development
```

The app will work without a `.env` file using default values, but you should set a proper `JWT_SECRET` for production.

## Running the Project

### Development Mode

For development with hot-reload:
```bash
npm run dev
```

This uses nodemon to automatically restart the server when you make changes.

### Production Mode

First, build the TypeScript code:
```bash
npm run build
```

Then start the server:
```bash
npm start
```

The server will start on `http://localhost:4000` (or whatever port you configured).

## API Endpoints

Base URL: `http://localhost:4000/api/v1`

### Authentication
- `POST /auth/register` - Register a new user (PATIENT or DOCTOR)
- `POST /auth/login` - Login and get JWT token
- `POST /auth/logout` - Logout (requires auth)

### Users
- `GET /users` - Get list of all users (requires auth)

### Doctors
- `GET /doctors` - List all doctors (requires auth)
  - Query param: `?availability=ONLINE` or `?availability=BUSY` to filter
- `POST /doctors/status` - Update doctor availability status (doctor only)

### Health Check
- `GET /health` - Server health check

## WebSocket Connection

Connect to the WebSocket server at `ws://localhost:4000/ws`

Authentication can be done via:
- Query parameter: `ws://localhost:4000/ws?token=YOUR_JWT_TOKEN`
- Or via `Sec-WebSocket-Protocol` header: `bearer YOUR_JWT_TOKEN`

### WebSocket Message Types

**Client to Server:**
- `{ type: "chat", to: "user-id", message: "Hello" }`
- `{ type: "call-initiate", to: "doctor-id" }`
- `{ type: "webrtc-offer", to: "user-id", payload: {...} }`
- `{ type: "webrtc-answer", to: "user-id", payload: {...} }`
- `{ type: "webrtc-ice-candidate", to: "user-id", payload: {...} }`
- `{ type: "call-accept", to: "user-id" }`
- `{ type: "call-reject", to: "user-id" }`
- `{ type: "call-end", to: "user-id" }`

**Server to Client:**
- `{ type: "users-update", users: [...] }` - Broadcast when user list changes
- `{ type: "chat", from: "user-id", message: "...", sentAt: "..." }`
- `{ type: "call-initiate", from: "user-id" }`
- `{ type: "error", message: "...", context: "..." }`

## Test Accounts

The server automatically seeds two test accounts on startup:

**Doctor:**
- Email: `doctor@sayurveda.test`
- Password: `changeme123`

**Patient:**
- Email: `patient@sayurveda.test`
- Password: `changeme123`

You can use these to test the API without registering new accounts.

## Postman Collection

There's a Postman collection included in the `postman/` directory that you can import to test the API endpoints. Make sure to set the `base_url` variable to `http://localhost:4000` and the `api_version` to `v1`.



## Troubleshooting

If you get port already in use errors, either:
- Change the PORT in your `.env` file
- Or kill the process using port 4000

On Windows:
```bash
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

On Mac/Linux:
```bash
lsof -ti:4000 | xargs kill
```

## License

This is a take-home assignment project.

