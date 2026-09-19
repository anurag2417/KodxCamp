import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected', { host: mongoose.connection.host });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { err: err.message });
  });

  await mongoose.connect(env.MONGODB_URI, {
    // Give up fast rather than hang on cold start
    serverSelectionTimeoutMS: 10_000,
    // Reasonable pool size for a single Node process
    maxPoolSize: 20,
    minPoolSize: 2,
    // Atlas friendly
    retryWrites: true,
    // Return plain JS objects by default (we already .lean() most places)
    autoIndex: env.NODE_ENV !== 'production',
  });
}