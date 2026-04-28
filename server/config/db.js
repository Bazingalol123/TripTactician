import mongoose from 'mongoose';

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI not set — skipping database connection');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

export default connectDB;
