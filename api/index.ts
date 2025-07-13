import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import 'dotenv/config';
import path from "path";
import { fileURLToPath } from "url";

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

const app = express();

// Increase payload size limits for Vercel
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS headers for Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Session configuration optimized for serverless
app.use(session({
  secret: process.env.SESSION_SECRET || 'finanzas-pro-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  name: 'finanzas-session'
}));

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      url: process.env.DATABASE_URL ? 'configured' : 'not configured',
      type: process.env.DATABASE_URL?.includes('neon') ? 'Neon PostgreSQL' : 'Unknown'
    },
    session: {
      secret: process.env.SESSION_SECRET ? 'configured' : 'using default'
    },
    message: 'API is working correctly'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Basic auth test endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Simple test - in production this would check against database
    if (username === 'admin' && password === 'admin123') {
      req.session!.userId = 1;
      res.json({ 
        user: { 
          id: 1, 
          username: 'admin', 
          email: 'admin@example.com', 
          fullName: 'Administrator', 
          role: 'admin' 
        } 
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ 
        message: 'Username, email, password and fullName are required' 
      });
    }
    
    // Simple validation
    if (username.length < 3) {
      return res.status(400).json({ 
        message: 'Username must be at least 3 characters' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters' 
      });
    }
    
    if (fullName.length < 2) {
      return res.status(400).json({ 
        message: 'Full name must be at least 2 characters' 
      });
    }
    
    // Check if username is admin (reserved)
    if (username === 'admin') {
      return res.status(400).json({ 
        message: 'Username "admin" is reserved' 
      });
    }
    
    // For now, create a simple user (in production this would save to database)
    const newUser = {
      id: Date.now(), // Simple ID generation
      username,
      email,
      fullName,
      role: 'employee'
    };
    
    // Auto-login after registration
    req.session!.userId = newUser.id;
    
    res.status(201).json({ 
      user: { 
        id: newUser.id, 
        username: newUser.username, 
        email: newUser.email, 
        fullName: newUser.fullName, 
        role: newUser.role 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor. Por favor, intenta de nuevo.' 
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  req.session!.destroy(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user endpoint
app.get('/api/auth/me', (req, res) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // For now, return a simple user (in production this would fetch from database)
  if (userId === 1) {
    res.json({ 
      user: { 
        id: 1, 
        username: 'admin', 
        email: 'admin@example.com', 
        fullName: 'Administrator', 
        role: 'admin' 
      } 
    });
  } else {
    res.json({ 
      user: { 
        id: userId, 
        username: 'user', 
        email: 'user@example.com', 
        fullName: 'User', 
        role: 'employee' 
      } 
    });
  }
});

// Database connection test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    // Simple database connection test without external imports
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return res.json({
        status: 'error',
        error: 'DATABASE_URL not configured',
        timestamp: new Date().toISOString()
      });
    }
    
    // Try to connect using a simple test
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: dbUrl });
    
    try {
      const client = await pool.connect();
      await client.query('SELECT 1 as test');
      client.release();
      await pool.end();
      
      res.json({
        status: 'ok',
        database: {
          connected: true,
          url: 'configured',
          type: 'Neon PostgreSQL'
        },
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      await pool.end();
      res.json({
        status: 'error',
        database: {
          connected: false,
          url: 'configured',
          type: 'Neon PostgreSQL'
        },
        error: dbError instanceof Error ? dbError.message : 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  
  // Log additional error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error stack:', err.stack);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code
    });
  }
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ 
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
});

// Determinar el path absoluto a la carpeta dist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../dist/public");

// Servir archivos estáticos
app.use(express.static(distPath));

// Fallback: servir index.html para rutas que no sean de API
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Export for Vercel
export default app; 