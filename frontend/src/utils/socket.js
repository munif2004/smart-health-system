import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://smart-health-system-io2m.onrender.com';

class SocketService {
  constructor() {
    this.socket = null;
    this.activeUserRoom = null;
    this.baseListenersAttached = false;
  }

  connect() {
    if (this.socket) {
      if (!this.socket.connected) this.socket.connect();
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1200,
      reconnectionDelayMax: 6000,
      timeout: 20000,
      autoConnect: true
    });

    if (this.baseListenersAttached) return this.socket;
    this.baseListenersAttached = true;

    this.socket.on('connect', () => {
      if (this.activeUserRoom) {
        this.socket.emit('join-user', this.activeUserRoom);
      }
      console.log('Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection issue:', err.message);
    });

    return this.socket;
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.activeUserRoom = null;
    this.baseListenersAttached = false;
  }

  doctorLogin(doctorId) {
    this.connect();
    this.activeUserRoom = { userId: doctorId, role: 'doctor' };
    if (this.socket.connected) {
      this.socket.emit('doctor-login', doctorId);
      this.socket.emit('join-user', this.activeUserRoom);
    } else {
      this.socket.once('connect', () => {
        this.socket.emit('doctor-login', doctorId);
        this.socket.emit('join-user', this.activeUserRoom);
      });
    }
  }

  patientLogin(patientId) {
    this.connect();
    this.activeUserRoom = { userId: patientId, role: 'patient' };
    if (this.socket.connected) {
      this.socket.emit('patient-login', patientId);
      this.socket.emit('join-user', this.activeUserRoom);
    } else {
      this.socket.once('connect', () => {
        this.socket.emit('patient-login', patientId);
        this.socket.emit('join-user', this.activeUserRoom);
      });
    }
  }

  onNewAppointment(callback) {
    this.on('new-appointment', callback);
  }

  onAppointmentUpdated(callback) {
    this.on('appointment-updated', callback);
  }

  onAppointmentCancelled(callback) {
    this.on('appointment-cancelled', callback);
  }

  onReportGenerated(callback) {
    this.on('report-generated', callback);
  }

  onPrescriptionAdded(callback) {
    this.on('prescription-added', callback);
  }

  onDoctorOnline(callback) {
    this.on('doctor-online', callback);
  }

  emit(event, payload, ack) {
    this.connect();
    this.socket.emit(event, payload, ack);
  }

  on(event, callback) {
    this.connect();
    this.socket.off(event, callback);
    this.socket.on(event, callback);
  }

  removeListener(event, callback) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }
}

const socketService = new SocketService();

export default socketService;
