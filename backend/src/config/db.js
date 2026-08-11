import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  let uri = process.env.MONGODB_URI;

  if (!uri) {
    try {
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      console.log('Using in-memory MongoDB server for local development');
    } catch (error) {
      uri = 'mongodb://127.0.0.1:27017/campus-lost-found';
      console.warn('Falling back to localhost MongoDB:', error.message);
    }
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return false;
  }
};

export default connectDB;
