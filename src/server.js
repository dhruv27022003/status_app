const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const incidentRoutes = require('./routes/incidents');
const publicRoutes = require('./routes/public');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/public', publicRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Status Page API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      services: '/api/services',
      incidents: '/api/incidents',
      public: '/api/public',
      health: '/health'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error', 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Subscribe to a user's updates
  socket.on('subscribe', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Client ${socket.id} subscribed to user ${userId}`);
  });

  // Unsubscribe from updates
  socket.on('unsubscribe', (userId) => {
    socket.leave(`user:${userId}`);
    console.log(`Client ${socket.id} unsubscribed from user ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper function to emit service updates
const emitServiceUpdate = (userId, serviceId, status) => {
  io.to(`user:${userId}`).emit('service:update', {
    serviceId,
    status,
    timestamp: new Date(),
  });
};

// Helper function to emit incident updates
const emitIncidentUpdate = (userId, incident) => {
  io.to(`user:${userId}`).emit('incident:update', {
    incidentId: incident._id,
    status: incident.status,
    message: incident.message,
    title: incident.title,
    serviceId: incident.serviceId,
    timestamp: new Date(),
  });
};

// Export io and helper functions for use in routes
app.locals.io = io;
app.locals.emitServiceUpdate = emitServiceUpdate;
app.locals.emitIncidentUpdate = emitIncidentUpdate;

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };

