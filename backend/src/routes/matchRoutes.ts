import express from 'express';
import JWT from '../middlewares/authMiddleware.js';
import { getMatches, getSuggestions, likeUser, unlikeUser, getLikeStatus } from '../controllers/matchingController.ts';

export const SuggestionsRout = express.Router();


SuggestionsRout.post('/suggestions', JWT.verifyAndDecodeToken, getSuggestions);
SuggestionsRout.get('/matches', JWT.verifyAndDecodeToken, getMatches);
SuggestionsRout.post('/like/:userId', JWT.verifyAndDecodeToken, likeUser);
SuggestionsRout.delete('/like/:userId', JWT.verifyAndDecodeToken, unlikeUser);
SuggestionsRout.get('/like/:userId/status', JWT.verifyAndDecodeToken, getLikeStatus);
