import express from 'express';
import { googleOauthController } from '../controllers/oauthController.ts';



export const googleOauthRoute = express.Router();

googleOauthRoute.get('/google', googleOauthController);
