/**
 * EUDA Questionnaire Backend - Main Entry Point
 * Clean architecture for Vercel serverless deployment
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import questionnaireRoutes from './routes/questionnaires.js';
import responseRoutes from './routes/responses.js';
import fileUploadRoutes from './routes/file-upload.js';

// Initialize Express
const app = express();

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);

    // Allow any Vercel deployment from this project
    if (origin.includes('etrit-neziris-projects-f42b4265.vercel.app')) return callback(null, true);

    // Allow custom frontend URL if set
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);

    // Deny all other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'EUDA Backend API v2.0',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint - check env vars
app.get('/debug/env', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL ? `Set (${process.env.SUPABASE_URL.substring(0, 30)}...)` : 'NOT SET',
    supabaseKey: process.env.SUPABASE_SERVICE_KEY ? `Set (length: ${process.env.SUPABASE_SERVICE_KEY.length})` : 'NOT SET',
    jwtSecret: process.env.JWT_SECRET ? `Set (length: ${process.env.JWT_SECRET.length})` : 'NOT SET',
    frontendUrl: process.env.FRONTEND_URL || 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'NOT SET'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questionnaires', questionnaireRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/file-upload', fileUploadRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'EUDA Questionnaire API',
    version: '2.0.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      admin: '/api/admin',
      questionnaires: '/api/questionnaires',
      responses: '/api/responses',
      fileUpload: '/api/file-upload'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.url} not found`
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// For Vercel serverless
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}
