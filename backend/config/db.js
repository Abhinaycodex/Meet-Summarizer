import mongoose from 'mongoose';
import logger from '../src/utils/logger.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); 
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export default connectDB;
