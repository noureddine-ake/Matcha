import express from 'express';
import { completeProfile } from '../controllers/profileContreoller.js';
import JWT from '../middlewares/authMiddleware.js';
import multer from 'multer';

export const profileRoute = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

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
