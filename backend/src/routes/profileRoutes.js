import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';
import JWT from '../middlewares/authMiddleware.js';
import { 
  completeProfile, 
  getProfile, 
  logoutController 
} from '../controllers/profileContreoller.js';

export const profileRoute = express.Router();

// ----------------------------
// Ensure uploads folder exists
// ----------------------------
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ----------------------------
// Multer setup for file uploads
// ----------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// ----------------------------
// Routes
// ----------------------------

// Complete profile (protected, with file uploads)
profileRoute.post(
  '/complete',
  JWT.verifyAndDecodeToken,
  upload.fields([
    { name: 'photo0', maxCount: 1 },
    { name: 'photo1', maxCount: 1 },
    { name: 'photo2', maxCount: 1 },
    { name: 'photo3', maxCount: 1 },
    { name: 'photo4', maxCount: 1 },
  ]),
  completeProfile
);

// Get current logged-in user's profile (protected)
profileRoute.get('/', JWT.verifyAndDecodeToken, getProfile);

// Logout current user
profileRoute.post('/logout', logoutController);

// Reset password
