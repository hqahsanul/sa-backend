type Notifier = {
  broadcastUserList: () => void;
};

let currentNotifier: Notifier | null = null;

export function registerNotifier(notifier: Notifier): void {
  currentNotifier = notifier;
}

export function notifyUserListChanged(): void {
  currentNotifier?.broadcastUserList();
}

