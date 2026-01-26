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

const allowedOrigins = [
  'https://nvh-customer-management.vercel.app',
  'https://nvh-customer-management-4k5at189h-harshi1111s-projects.vercel.app',
  'https://nvh-customer-management-gtvw1nyb9-harshi1111s-projects.vercel.app',
  'https://nvh-customer-management-fcvqj9tr6-harshi1111s-projects.vercel.app', // ADD THIS
  'https://nvh-customer-management-s3yn-4zmxhccyf-harshi1111s-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

// STEP 1: Handle OPTIONS requests FIRST (before CORS middleware)
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// STEP 2: CORS middleware
app.use(cors({
  origin: function (origin: string | undefined, callback: Function) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes
app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'NVH Agri System Backend',
    allowedOrigins: allowedOrigins
  });
});

// Protected routes
app.use('/api/customers', customerRoutes);
app.use('/api/projects',  projectRoutes);
app.use('/api/transactions', transactionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  
  if (error.message === 'Not allowed by CORS') {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      allowedOrigins: allowedOrigins
    });
  }
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error'
  });
});

export default app;