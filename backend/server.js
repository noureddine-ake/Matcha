import express from 'express';
import dotenv from 'dotenv';
import { pool } from './src/config/config.js';
import { registerRoute } from './src/routes/authRoutes.js';
import { profileRoute } from './src/routes/profileRoutes.js';
import cors from 'cors';
import { googleOauthRoute } from './src/routes/oauthRoutes.js';
import { googleCallbackController } from './src/controllers/oauthController.js';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


// Serve uploads folder
const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// cors policy 
const corsOptions = {
  origin: ["http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions));


// Health check route
app.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    res.status(200).json({
      status: 'ok',
      server: 'running',
      database: 'connected',
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
});


// routes
app.use('/api/auth', registerRoute);
app.use('/api/profile', profileRoute);
app.use('/api/oauth', googleOauthRoute);
app.use('/google/callback', googleCallbackController);

// not found
app.use((req, res) => res.send("not found"));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

