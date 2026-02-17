import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import adsRoutes from './modules/ads/ad.routes';
import chatsRoutes from './modules/chats/chat.routes';
import adminRoutes from './modules/admin/admin.routes';
import complaintsRoutes from './modules/complaints/complaints.routes';
import { errorHandler } from './middlewares/error.middleware';
import path from 'path';

export const app = express();

app.use(cors({
  origin: env.clientOrigin,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/ads', adsRoutes);
app.use('/chats', chatsRoutes);
app.use('/admin', adminRoutes);
app.use('/complaints', complaintsRoutes);

// serve uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// error handler (should be last)
app.use(errorHandler);
