import express from 'express';
import JWT from '../middlewares/authMiddleware.js';
import { getLikes } from '../controllers/likesController.ts';

export const LikestRoutes = express.Router();


LikestRoutes.get('/likes', JWT.verifyAndDecodeToken, getLikes);