const express = require('express');
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const costRoutes = require('./routes/cost');
const exportRoutes = require('./routes/export');
const pricePredictionRoutes = require('./routes/price-prediction');
const chatbotRoutes = require('./routes/chatbot');
const floorplanRoutes = require('./routes/floorplan');
const costEstimatesRoutes = require('./routes/cost-estimates');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restmage';
const MONGODB_PING_DB = process.env.MONGODB_PING_DB || 'admin';
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const ALLOW_ALL_ORIGINS = (process.env.ALLOW_ALL_ORIGINS === 'true') || (process.env.NODE_ENV !== 'production');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || CLIENT_URL)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;

const app = express();

// Trust proxy for accurate IP detection behind reverse proxies (e.g., Railway)
const isProduction = process.env.NODE_ENV === 'production';
app.set('trust proxy', isProduction ? 1 : false);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (ALLOW_ALL_ORIGINS) return callback(null, true);
      // Allow server-to-server and tools with no origin
      if (!origin) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      console.warn('Socket.IO CORS blocked origin:', origin);
      return callback(null, false);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS
});

// CORS must be applied BEFORE helmet and other middleware
// to properly handle preflight OPTIONS requests
const corsOptions = {
  origin: (origin, callback) => {
    // Log origin for debugging in production
    if (isProduction) {
      console.log('CORS request from origin:', origin);
    }
    if (ALLOW_ALL_ORIGINS) return callback(null, true);
    if (!origin) return callback(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // Return false instead of error to avoid crashing - will result in no CORS headers
    console.warn('CORS blocked origin:', origin, '| Allowed:', ALLOWED_ORIGINS);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(apiRateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make Socket.IO available to routes
app.set('io', io);

// Request logging middleware - reduced in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Minimal logging in production
    console.log(`${req.method} ${req.url}`);
  } else {
    // Verbose logging in development
    console.log(`\n📨 ${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin || 'No origin');
    console.log('Content-Type:', req.headers['content-type'] || 'No content-type');
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Body:', JSON.stringify(req.body, null, 2));
    }
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/cost', costRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/price-prediction', pricePredictionRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/floorplan', floorplanRoutes);
app.use('/api/cost-estimates', costEstimatesRoutes);

// Serve static assets in production (only if client build exists)
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const clientBuildPath = path.join(__dirname, '../client/build');
  const indexPath = path.join(clientBuildPath, 'index.html');
  
  // Only serve static files if the client build directory exists
  if (fs.existsSync(clientBuildPath) && fs.existsSync(indexPath)) {
    console.log('Serving static files from client build');
    app.use(express.static(clientBuildPath));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(indexPath);
    });
  } else {
    console.log('Client build not found - running as API-only server');
    // Redirect root to API health check or return info
    app.get('/', (req, res) => {
      res.json({
        message: 'Restmage API Server',
        status: 'running',
        api: '/api',
        health: '/api/health',
        docs: 'API endpoints are available under /api/*'
      });
    });
  }
}

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
    
    // Bind to 0.0.0.0 for production (required by Render and other cloud platforms)
    const HOST = process.env.HOST || '0.0.0.0';
    server.listen(PORT, HOST, () => {
      console.log(`Server running on ${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`WebSocket ready for real-time updates`);
    });
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const shutdownGracefully = (signal) => {
  console.log(`${signal} received. Shutting down gracefully`);
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      console.log('Server closed. Process terminated');
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
process.on('SIGINT', () => shutdownGracefully('SIGINT'));

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