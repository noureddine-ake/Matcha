import express from 'express';
import { googleOauthController } from '../controllers/oauthController.js';



export const googleOauthRoute = express.Router();

googleOauthRoute.get('/google', googleOauthController);
