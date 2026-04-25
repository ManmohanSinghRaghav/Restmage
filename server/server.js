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
const aiRoutes = require('./routes/ai');
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

// Trust proxy for accurate IP detection behind reverse proxies
const isProduction = process.env.NODE_ENV === 'production';
app.set('trust proxy', isProduction ? 1 : false);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (ALLOW_ALL_ORIGINS) return callback(null, true);
      if (!origin) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
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

const corsOptions = {
  origin: (origin, callback) => {
    if (ALLOW_ALL_ORIGINS) return callback(null, true);
    if (!origin) return callback(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(apiRateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/cost', costRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/price-prediction', pricePredictionRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/floorplan', floorplanRoutes);
app.use('/api/cost-estimates', costEstimatesRoutes);

if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const clientBuildPath = path.join(__dirname, '../client/build');
  const indexPath = path.join(clientBuildPath, 'index.html');
  
  if (fs.existsSync(clientBuildPath) && fs.existsSync(indexPath)) {
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(indexPath);
    });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const setupWebSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    socket.on('join-project', (projectId) => {
      socket.join(projectId);
    });
    socket.on('map-update', (data) => {
      socket.to(data.projectId).emit('map-updated', data);
    });
    socket.on('disconnect', () => {});
  });
};

setupWebSocketHandlers(io);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    await verifyMongoDeployment(MONGODB_URI);
  } catch (error) {
    console.warn('⚠️ Database connection failed. Running in degraded mode.');
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
  });
};

const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

startServer();

async function verifyMongoDeployment(uri) {
  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });
  try {
    await client.connect();
    await client.db(MONGODB_PING_DB).command({ ping: 1 });
    console.log('MongoDB deployment ping successful');
  } catch (error) {
    console.warn('MongoDB deployment ping failed');
  } finally {
    await client.close();
  }
}

module.exports = { app, server, io };