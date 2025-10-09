import express from 'express';
import dotenv from 'dotenv';
import { pool } from './src/config/config.js';
import { getAllUsers,createUser } from './src/models/userModel.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());


// get users
// app.get('/users', async (req, res) => {
//   try {
    
//     const users = await getAllUsers();
//     res.status(200).json(users);
//   }
//   catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
// add user route
// app.post('/users', async (req, res) => {
//   try {
//     const { email, username, first_name, last_name, password_hash } = req.body;

//     // Basic validation
//     if (!email || !username || !password_hash) {
//       return res.status(400).json({ error: 'email, username, and password_hash are required' });
//     }

//     // // Check if user already exists
//     // const existingUser = await getUserByEmail(email);
//     // if (existingUser) {
//     //   return res.status(409).json({ error: 'User with this email already exists' });
//     // }

//     const user = await createUser({
//       email,
//       username,
//       first_name,
//       last_name,
//       password_hash
//     });

//     res.status(201).json(user);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
// Health check route
app.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1'); // simple test query
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
