import express from 'express';
import JWT from '../middlewares/authMiddleware.js';
import { getLikes } from '../controllers/likesController.js';

export const LikestionsRout = express.Router();


LikestionsRout.get('/likes', JWT.verifyAndDecodeToken, getLikes);