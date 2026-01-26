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

const app = express();

// FIXED CORS CONFIGURATION
const allowedOrigins = [
  'https://nvh-customer-management.vercel.app',
  'https://nvh-customer-management-4k5at189h-harshi1111s-projects.vercel.app',
  // Include your backend URL for testing
  'https://nvh-customer-management-s3yn-4zmxhccyf-harshi1111s-projects.vercel.app',
  // Local development
  'http://localhost:3000',
  'http://localhost:5173'
];

// CORS MUST BE FIRST!
app.use(cors({
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log blocked origins for debugging
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight requests for 10 minutes
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Security middleware
app.use(helmet({
  // Adjust helmet for API use
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Session middleware (for family authentication)
app.use(session({
  secret: process.env.JWT_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes (no authentication needed)
app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'NVH Agri System Backend',
    allowedOrigins: allowedOrigins // Useful for debugging
  });
});

// Protected routes (require authentication)
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/projects', authenticate, projectRoutes);
app.use('/api/transactions', authenticate, transactionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler with CORS error handling
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  
  // Handle CORS errors specifically
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error'
  });
});

export default app;