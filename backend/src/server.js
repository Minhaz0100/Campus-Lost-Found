import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import itemRoutes from './routes/items.js';
import claimRoutes from './routes/claims.js';
import notificationRoutes from './routes/notifications.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import User from './models/User.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

console.log("Allowed Origins:", allowedOrigins);

const corsOptions = {
  origin(origin, callback) {
    console.log("Incoming Origin:", origin);

    // Postman / Mobile App / Server-to-Server requests
    if (!origin) {
      return callback(null, true);
    }

    // Exact match
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all Vercel preview & production domains
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST"],
  },
});
  
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-chat', (itemId) => {
    socket.join(`chat-${itemId}`);
  });

  socket.on('leave-chat', (itemId) => {
    socket.leave(`chat-${itemId}`);
  });
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next();
  });
});

app.use(errorHandler);

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@campus.edu';
    const exists = await User.findOne({ email: adminEmail });
    if (!exists) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'admin123456',
        role: 'admin',
        isVerified: true,
        department: 'Administration',
      });
      console.log(`Admin user created: ${adminEmail}`);
    }
  } catch (error) {
    console.warn('Admin seed skipped:', error.message);
  }
};

const PORT = process.env.PORT || 5000;

connectDB().then(async (connected) => {
  if (connected) {
    await seedAdmin();
  } else {
    console.warn('Continuing without database seeding.');
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;
