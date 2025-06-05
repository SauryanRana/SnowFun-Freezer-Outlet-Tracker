/**
 * server.js - Main Express server for Snowfun Nepal Freezer & Outlet Tracker
 * 
 * This is the entry point for the backend API that powers the Snowfun Nepal
 * freezer tracking application. It handles authentication, database connections,
 * route management, and error handling.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createConnection } from 'typeorm';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import authRoutes from './routes/auth.routes.js';
import authOtpRoutes from './routes/auth-otp.routes.js';
import userRoutes from './routes/user.routes.js';
import dealerRoutes from './routes/dealer.routes.js';
import shopRoutes from './routes/shop.routes.js';
import fridgeRoutes from './routes/fridge.routes.js';
import visitRoutes from './routes/visit.routes.js';
import reportRoutes from './routes/report.routes.js';

// Middleware imports
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { rbacMiddleware } from './middleware/rbac.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database connection
const initializeDatabase = async () => {
  try {
    await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'snowfun_nepal',
      entities: [path.join(__dirname, 'models', '*.js')],
      synchronize: process.env.NODE_ENV !== 'production', // Only in dev mode
      logging: process.env.NODE_ENV !== 'production',
    });
    console.log('📦 Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Configure middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(helmet()); // Security headers
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Logging

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', authOtpRoutes); // Add OTP authentication routes
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/dealers', authMiddleware, dealerRoutes);
app.use('/api/shops', authMiddleware, shopRoutes);
app.use('/api/fridges', authMiddleware, fridgeRoutes);
app.use('/api/visits', authMiddleware, visitRoutes);
app.use('/api/reports', authMiddleware, rbacMiddleware(['admin']), reportRoutes);

// Error handling middleware (must be after all routes)
app.use(errorHandler);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`❄️ Snowfun Nepal API is ready!`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Start the server
startServer();

export default app; // For testing purposes
