import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';

// Import routes
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import projectRoutes from './routes/project.routes';
import transactionRoutes from './routes/transaction.routes';

// Import middleware
import { authenticate, authorize } from './middleware/auth';
import { corsOptions, handleCorsError } from './utils/corsConfig';

const app = express();

// 1. Handle OPTIONS preflight requests FIRST - SIMPLIFIED
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  
  // TEMPORARY: Allow ANY origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// 2. Apply CORS middleware - SIMPLE
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// 3. Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}));

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Public routes
app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'NVH Agri System Backend',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Protected routes
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/projects', authenticate, projectRoutes);
app.use('/api/transactions', authenticate, transactionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method 
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  
  // Handle CORS errors
  if (error.message === 'Not allowed by CORS') {
    return handleCorsError(req, res, error);
  }
  
  // Set CORS headers for all errors
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Return appropriate error response
  const status = error.statusCode || error.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500 
    ? 'Internal server error' 
    : error.message;
  
  res.status(status).json({
    error: message,
    status,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

export default app;