import express from 'express';
import dotenv from 'dotenv';

import { registerRoute } from './src/routes/authRoutes.js';
import { profileRoute } from './src/routes/profileRoutes.js';
import { googleOauthRoute } from './src/routes/oauthRoutes.js';
import { SuggestionsRout } from './src/routes/matchRoutes.js';
import { LikestRoutes } from './src/routes/likesRoutes.js';
import { NotificationsRouts } from './src/routes/notificationRoutes.js';
import chatRoutes  from './src/routes/chatRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import { userRoutes } from './src/routes/userRoutes.js';
import { emailUpdateRoute } from './src/routes/emailUpdateRoutes.js';

import logger from './utils/logger.js';

import { errorHandler } from './src/middlewares/errorMiddleware.js';
import cors from 'cors';
import { googleCallbackController } from './src/controllers/oauthController.js';
import path from 'path';
import { swaggerUi, swaggerSpec } from "./swagger.js";
import { setupWebSocket } from './src/config/websocket.js';
import http from 'http';
import cookieParser from 'cookie-parser';
import xss from 'xss-clean';
import morgan from 'morgan';
import { initDB } from './database/index.js';

// database custom ORM link

try {
    await initDB()
    console.log("-STEP-1: database created successfully");
} catch (error) {
    console.error(error);
}

dotenv.config();

const app: express.Application = express();
const PORT = process.env.PORT || 5000;


app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(xss());
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const corsOptions = {
  origin: [`${process.env.FRONTEND_URL}` || 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions));


// Health check route
// app.get('/health', async (req, res) => {
//   try {
//     const client = await pool.connect();
//     await client.query('SELECT 1');
//     client.release();

//     res.status(200).json({
//       status: 'ok',
//       server: 'running',
//       database: 'connected',
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: 'error',
//       message: err.message,
//     });
//   }
// });


// routes
app.use('/api/auth', registerRoute);
app.use('/api/profile', profileRoute);
app.use('/api/oauth', googleOauthRoute);
app.use('/google/callback', googleCallbackController);
app.use('/api', SuggestionsRout);
app.use('/api', LikestRoutes);
app.use('/api/notifications', NotificationsRouts);
app.use("/api/chat", chatRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/email-update", emailUpdateRoute);


const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir)); // TODO: add cdn

// not found
app.use((req, res) => res.status(404).json({message: "not found"}));

const server = http.createServer(app);

setupWebSocket(server);

// Error handling middleware
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server + WebSocket running on port ${PORT}`);
});
