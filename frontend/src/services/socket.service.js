import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.queuedMessages = [];
    this.autoReconnect = true;
    this.connectionTimeout = 10000; // 10 seconds
    
    // Event types
    this.EVENTS = {
      // Connection events
      CONNECT: 'connect',
      DISCONNECT: 'disconnect',
      CONNECT_ERROR: 'connect_error',
      RECONNECT: 'reconnect',
      RECONNECT_ATTEMPT: 'reconnect_attempt',
      RECONNECT_ERROR: 'reconnect_error',
      RECONNECT_FAILED: 'reconnect_failed',
      
      // Application events
      REPORT_GENERATED: 'report_generated',
      REPORT_PROGRESS: 'report_progress',
      REPORT_FAILED: 'report_failed',
      NOTIFICATION: 'notification',
      USER_ONLINE: 'user_online',
      USER_OFFLINE: 'user_offline',
      MESSAGE: 'message',
      TYPING: 'typing',
      READ_RECEIPT: 'read_receipt',
      
      // Room events
      JOIN_ROOM: 'join_room',
      LEAVE_ROOM: 'leave_room',
      ROOM_MESSAGE: 'room_message',
      ROOM_USERS: 'room_users',
      
      // System events
      SYSTEM_ALERT: 'system_alert',
      MAINTENANCE: 'maintenance',
      UPDATE_AVAILABLE: 'update_available',
    };
  }

  // Initialize socket connection
  initialize(token = null) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return this.socket;
    }

    const options = {
      reconnection: this.autoReconnect,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: this.connectionTimeout,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true,
    };

    // Add authentication if token is provided
    if (token) {
      options.auth = { token };
    }

    // Get server URL from environment or use default
    const serverUrl = process.env.REACT_APP_WS_URL || 
                     process.env.REACT_APP_API_URL?.replace('http', 'ws') || 
                     'ws://localhost:3001';

    this.socket = io(serverUrl, options);

    this.setupEventListeners();
    
    return this.socket;
  }

  // Setup event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on(this.EVENTS.CONNECT, () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection_established', { timestamp: Date.now() });
      
      // Process any queued messages
      this.processQueuedMessages();
    });

    this.socket.on(this.EVENTS.DISCONNECT, (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // The server has forcefully disconnected the socket
        // You need to manually reconnect
        this.socket.connect();
      }
    });

    this.socket.on(this.EVENTS.CONNECT_ERROR, (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on(this.EVENTS.RECONNECT, (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on(this.EVENTS.RECONNECT_ATTEMPT, (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on(this.EVENTS.RECONNECT_ERROR, (error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on(this.EVENTS.RECONNECT_FAILED, () => {
      console.error('Reconnection failed after', this.maxReconnectAttempts, 'attempts');
    });
  }

  // Connect to socket
  connect(token = null) {
    if (!this.socket) {
      this.initialize(token);
    } else if (!this.isConnected) {
      if (token) {
        this.socket.auth = { token };
      }
      this.socket.connect();
    }
  }

  // Disconnect from socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.queuedMessages = [];
      this.listeners.clear();
    }
  }

  // Emit event
  emit(event, data, callback) {
    if (this.socket && this.isConnected) {
      if (callback) {
        this.socket.emit(event, data, callback);
      } else {
        this.socket.emit(event, data);
      }
    } else {
      // Queue message if not connected
      this.queuedMessages.push({ event, data, callback });
      console.warn('Socket not connected, message queued:', event);
    }
  }

  // Process queued messages
  processQueuedMessages() {
    while (this.queuedMessages.length > 0) {
      const { event, data, callback } = this.queuedMessages.shift();
      this.emit(event, data, callback);
    }
  }

  // Listen to event
  on(event, callback) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    // Store listener for later removal
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Add listener to socket
    this.socket.on(event, callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      
      // Remove from listeners map
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    } else {
      // Remove all listeners for this event
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (!this.socket) return;

    this.socket.removeAllListeners();
    this.listeners.clear();
  }

  // Join a room
  joinRoom(roomId, userData = {}) {
    this.emit(this.EVENTS.JOIN_ROOM, { roomId, userData });
  }

  // Leave a room
  leaveRoom(roomId) {
    this.emit(this.EVENTS.LEAVE_ROOM, { roomId });
  }

  // Send message to room
  sendRoomMessage(roomId, message) {
    this.emit(this.EVENTS.ROOM_MESSAGE, { roomId, message });
  }

  // Send private message
  sendPrivateMessage(userId, message) {
    this.emit(this.EVENTS.MESSAGE, { to: userId, message });
  }

  // Send typing indicator
  sendTypingIndicator(roomId, isTyping) {
    this.emit(this.EVENTS.TYPING, { roomId, isTyping });
  }

  // Send read receipt
  sendReadReceipt(messageId) {
    this.emit(this.EVENTS.READ_RECEIPT, { messageId });
  }

  // Subscribe to report updates
  subscribeToReport(reportId) {
    this.emit('subscribe_report', { reportId });
  }

  // Unsubscribe from report updates
  unsubscribeFromReport(reportId) {
    this.emit('unsubscribe_report', { reportId });
  }

  // Get socket status
  getStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.queuedMessages.length,
    };
  }

  // Reconnect manually
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }

  // Update authentication token
  updateAuthToken(token) {
    if (this.socket) {
      this.socket.auth = { token };
      
      // If connected, emit token update event
      if (this.isConnected) {
        this.emit('update_token', { token });
      }
    }
  }

  // Check if socket is connected
  isSocketConnected() {
    return this.socket?.connected || false;
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Set connection options
  setConnectionOptions(options) {
    if (this.socket) {
      Object.assign(this.socket.io.opts, options);
    }
  }

  // Ping server (for testing connection)
  ping() {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const startTime = Date.now();
      
      this.emit('ping', null, () => {
        const latency = Date.now() - startTime;
        resolve(latency);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);
    });
  }

  // Get online users
  getOnlineUsers() {
    return new Promise((resolve, reject) => {
      this.emit('get_online_users', null, (users) => {
        resolve(users);
      });

      setTimeout(() => {
        reject(new Error('Timeout getting online users'));
      }, 5000);
    });
  }

  // Create custom event listener with error handling
  createEventListener(event, callback, errorCallback) {
    this.on(event, (data) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
        if (errorCallback) {
          errorCallback(error, data);
        }
      }
    });
  }

  // Batch emit multiple events
  batchEmit(events) {
    events.forEach(({ event, data, callback }) => {
      this.emit(event, data, callback);
    });
  }

  // Cleanup resources
  cleanup() {
    this.removeAllListeners();
    this.disconnect();
    this.socket = null;
    this.isConnected = false;
    this.listeners.clear();
    this.queuedMessages = [];
  }

  // Debug mode
  enableDebug() {
    if (this.socket) {
      this.socket.onAny((event, ...args) => {
        console.log(`[Socket Debug] ${event}:`, args);
      });
    }
  }

  disableDebug() {
    if (this.socket) {
      this.socket.offAny();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export { SocketService, socketService };