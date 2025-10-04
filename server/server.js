const express = require('express');
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const costRoutes = require('./routes/cost');
const mapRoutes = require('./routes/maps');
const exportRoutes = require('./routes/export');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restmage';
const MONGODB_PING_DB = process.env.MONGODB_PING_DB || 'admin';
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS
});

app.use(helmet());
app.use(apiRateLimiter);
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/cost', costRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/export', exportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

const setupWebSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-project', (projectId) => {
      socket.join(projectId);
      console.log(`User ${socket.id} joined project ${projectId}`);
    });

    socket.on('map-update', (data) => {
      socket.to(data.projectId).emit('map-updated', data);
    });

    socket.on('cost-recalculate', (data) => {
      socket.to(data.projectId).emit('cost-updated', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

setupWebSocketHandlers(io);

const handleServerError = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
};

const handleNotFound = (req, res) => {
  res.status(404).json({ message: 'Route not found' });
};

app.use(handleServerError);
app.use('*', handleNotFound);

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB with Mongoose');
    
    await verifyMongoDeployment(MONGODB_URI);
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`WebSocket ready for real-time updates`);
    });
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const shutdownGracefully = () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Server closed. Process terminated');
  });
};

process.on('SIGTERM', shutdownGracefully);

startServer();

async function verifyMongoDeployment(uri) {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    await client.db(MONGODB_PING_DB).command({ ping: 1 });
    console.log('MongoDB deployment ping successful');
  } catch (error) {
    console.warn('MongoDB deployment ping failed:', error.message);
  } finally {
    await client.close();
  }
}

module.exports = { app, server, io };