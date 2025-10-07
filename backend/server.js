import express from 'express';
import dotenv from 'dotenv';
// import { connectDB } from './src/config/db.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Health check route
app.get('/health', async (req, res) => {
  try {
    // const dbStatus = await connectDB(true);
    res.status(200).json({
      status: 'ok',
      server: 'running',
      database: dbStatus ? 'connected' : 'disconnected',
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  try {
    // await connectDB();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
});
