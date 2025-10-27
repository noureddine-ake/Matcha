import express from 'express';
import JWT from '../middlewares/authMiddleware.js';
import { getSuggestions, likeUser } from '../controllers/matchingController.js';

export const SuggestionsRout = express.Router();


SuggestionsRout.post('/suggestions', JWT.verifyAndDecodeToken, getSuggestions);
SuggestionsRout.post('/like/:useerId', JWT.verifyAndDecodeToken, likeUser);
