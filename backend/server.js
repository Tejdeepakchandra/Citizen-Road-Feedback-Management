const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const http = require('http');
const path = require('path');

// Load env vars
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 5000,
  skip: (req) => req.url.startsWith('/socket.io'),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);


// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: [
        "'self'",
        process.env.CLIENT_URL,
        "wss://*.onrender.com",
        "wss://*.vercel.app"
      ]
    }
  }
}));

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// Parse cookies
app.use(cookieParser());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Apply rate limiting to API routes

// Static folder - IMPORTANT: This must be before routes
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Smart Road Feedback API is running',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// API Routes
const apiRoutes = require('./src/routes/api.routes');
app.use('/api', apiRoutes);

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Import database connection
    const connectDB = require('./src/config/database');
    await connectDB();
    
    // Import error handler (should be after routes)
    const errorHandler = require('./src/middleware/errorHandler');
    app.use(errorHandler);
    
    // Start listening
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API running in ${process.env.NODE_ENV} mode`);
      console.log(`📍 CLIENT_URL: ${process.env.CLIENT_URL}`);
      console.log(`📁 Uploads folder: ${path.join(__dirname, '../uploads')}`);
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


// SOCKET.IO MUST BE INITIALIZED OUTSIDE startServer()
const { init } = require("./src/config/socket");
init(server);


// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(`❌ Uncaught Exception: ${error.message}`);
  console.error(error);
  process.exit(1);
});

module.exports = { app, server };