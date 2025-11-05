import express from 'express';
import JWT from '../middlewares/authMiddleware.js';
import { getMatches, getSuggestions, likeUser } from '../controllers/matchingController.js';

export const SuggestionsRout = express.Router();


SuggestionsRout.post('/suggestions', JWT.verifyAndDecodeToken, getSuggestions);
SuggestionsRout.get('/matches', JWT.verifyAndDecodeToken, getMatches);
SuggestionsRout.post('/like/:userId', JWT.verifyAndDecodeToken, likeUser);
