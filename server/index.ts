import express from 'express';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { storage } from './storage.js';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'finanzas-pro-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new (LocalStrategy as any)(async (username: string, password: string, done: any) => {
  try {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return done(null, false, { message: 'Usuario no encontrado' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return done(null, false, { message: 'Contraseña incorrecta' });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await db.execute('SELECT NOW() as current_time');
    res.json({ 
      status: 'Database connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      status: 'Database error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Import and setup routes
import('./routes.js').then(async (routesModule) => {
  const { registerRoutes } = routesModule;
  const server = await registerRoutes(app);
  
  // Serve React app for all other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
  
  // Start server
  server.listen(PORT, () => {
    console.log(`[express] serving on port ${PORT}`);
  });
}).catch(error => {
  console.error('Error loading routes:', error);
  process.exit(1);
});

export default app; 