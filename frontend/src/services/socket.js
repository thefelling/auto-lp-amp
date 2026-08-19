// Socket service (untuk real-time progress monitoring)
// Note: Ini opsional, belum diimplementasikan di backend

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(token) {
    if (this.socket && this.connected) return;

    // Simulasi socket (karena backend belum pake socket.io)
    console.log('🔌 Socket service initialized (mock mode)');
    this.connected = true;
  }

  disconnect() {
    this.socket = null;
    this.connected = false;
  }

  emit(event, data) {
    console.log(`📤 Socket emit: ${event}`, data);
  }

  on(event, callback) {
    console.log(`📥 Socket on: ${event}`);
  }

  off(event, callback) {
    console.log(`📥 Socket off: ${event}`);
  }

  joinProjectRoom(projectId) {
    console.log(`📦 Joining project room: ${projectId}`);
  }

  leaveProjectRoom(projectId) {
    console.log(`📦 Leaving project room: ${projectId}`);
  }
}

export default new SocketService();