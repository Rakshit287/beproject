// cloudinary => store image and mp3 files
// cors => connect backend and frontend
//dotenv => stores environment variables
// express => backend apis
// mongoose => connect and manage database
// multer => upload image and mp3 files that we will get from frontend
// nodemon => create script that will easily run our project

// controllers folder => stores all api logics
// models folder => stores models that we will create using mongoose that will help us to manage the database
// routes folder => create routes for our backend

// .env stores secret key and api key


import http from 'http';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import songRouter from './src/routes/songRoute.js';
import connectDB from './src/config/mongodb.js';
import connectCloudinary from './src/config/cloudinary.js';
import albumRouter from './src/routes/albumRoute.js';
import authRouter from './src/routes/authRoute.js';
import userModel from './src/models/userModel.js';
import chatMessageModel from './src/models/chatMessageModel.js';
import chatRouter from './src/routes/chatRoute.js';
import { BOT_NAME, BOT_USER_ID, getBotResponse, getBotResponseWithSearch } from './src/services/chatBot.js';
import songModel from './src/models/songModel.js';
import albumModel from './src/models/albumModel.js';

// Verify bot user ID is a valid ObjectId
console.log('Bot User ID:', BOT_USER_ID, 'Type:', typeof BOT_USER_ID, 'Is ObjectId:', BOT_USER_ID instanceof mongoose.Types.ObjectId);

// App Config
const app = express();
const port = process.env.PORT || 4000;
const getJwtSecret = () => process.env.JWT_SECRET || 'devsecret';

// Middlewares
// The order is important: parse the body first, then handle cors.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Allow cross-origin requests from LAN and configured origins
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // mobile apps / curl
    if (allowedOrigins.length === 0) return callback(null, true); // allow all if not configured
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // allow same-hostname on different ports (e.g., LAN)
    try {
      const url = new URL(origin);
      if (allowedOrigins.some(o => {
        try {
          const u = new URL(o);
          return u.hostname === url.hostname;
        } catch { return false; }
      })) return callback(null, true);
    } catch {}
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// DB and Cloudinary Connection
connectDB();
connectCloudinary();

// Initialising Routes
app.use("/api/song", songRouter);

app.use('/api/album', albumRouter)
app.use('/api/auth', authRouter)
app.use('/api/chat', chatRouter)

app.get('/', (req, res) => res.send("API Working"));

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    credentials: true
  }
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
      || socket.handshake.query?.token
      || (socket.handshake.headers?.authorization && socket.handshake.headers.authorization.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.substring(7)
        : null);

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await userModel.findById(decoded.id).select('name');
    if (!user) {
      return next(new Error('Authentication error'));
    }

    socket.data.user = { id: user._id.toString(), name: user.name };
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.data.user.name} (${socket.data.user.id})`);
  
  socket.on('chat:send', async (payload = {}, ack) => {
    try {
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';
      if (!text) {
        if (ack) ack({ success: false, message: 'Message is required' });
        return;
      }

      console.log(`Message received from ${socket.data.user.name}: ${text}`);

      const message = await chatMessageModel.create({
        userId: socket.data.user.id,
        userName: socket.data.user.name,
        text
      });

      const formatted = {
        id: message._id.toString(),
        userId: message.userId.toString(),
        userName: message.userName,
        text: message.text,
        createdAt: message.createdAt
      };

      console.log(`Broadcasting message to all clients:`, formatted);
      io.emit('chat:message', formatted);
      if (ack) ack({ success: true, message: formatted });

      // Bot responds after a short delay
      setTimeout(async () => {
        try {
          // Use enhanced bot with music search capability
          const botResponse = await getBotResponseWithSearch(text, songModel, albumModel);
          
          const botMessage = await chatMessageModel.create({
            userId: BOT_USER_ID,
            userName: BOT_NAME,
            text: botResponse
          });

          const botFormatted = {
            id: botMessage._id.toString(),
            userId: botMessage.userId.toString(),
            userName: botMessage.userName,
            text: botMessage.text,
            createdAt: botMessage.createdAt
          };

          console.log(`Bot responding:`, botFormatted);
          io.emit('chat:message', botFormatted);
        } catch (error) {
          console.error('Error sending bot response:', error);
        }
      }, 1000 + Math.random() * 1000); // 1-2 second delay for natural feel
    } catch (error) {
      console.error('Error sending message:', error);
      if (ack) ack({ success: false, message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.data.user.name}`);
  });
});

server.listen(port, () => console.log(`Server started on ${port}`));


