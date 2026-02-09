import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';

export const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/health', healthRoutes);
app.use('/register', authRoutes);
