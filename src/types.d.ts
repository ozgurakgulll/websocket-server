export interface User {
  id: string;
  socketId: string;
  peerId?: string;  // Add this line
  message?:string
}

export interface Room {
  roomId: string;
  currentUser: User;
  availableUser: User;
  roomURL?: string | null;
  messages?: string[];
}

export interface SocketResponse {
  isUserFound: boolean;
  message: string;
  room: Room | null;
  peerId?: string;  // Add this line
}
