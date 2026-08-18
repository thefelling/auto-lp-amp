// Socket service (untuk real-time progress monitoring)
// Note: Ini opsional, belum diimplementasikan di backend
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(token) {
    if (this.socket && this.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('🔌 Socket connected');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('🔌 Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Join room untuk subscribe ke progress project tertentu
  joinProjectRoom(projectId) {
    if (this.socket && this.connected) {
      this.socket.emit('join-project', { projectId });
    }
  }

  leaveProjectRoom(projectId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave-project', { projectId });
    }
  }
}

export default new SocketService();