import { io } from 'socket.io-client';

// When running through Vite proxy or production Express server, connecting to current origin works automatically
const SOCKET_URL = window.location.hostname === 'localhost' && window.location.port === '5173'
  ? 'http://localhost:3001'
  : window.location.origin;

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
