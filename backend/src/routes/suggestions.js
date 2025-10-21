import express from 'express';
import JWT from '../middlewares/authMiddleware.js';
import { getSuggestions } from '../controllers/suggestions.js';

export const SuggestionsRout = express.Router();


SuggestionsRout.post('/suggestions', JWT.verifyAndDecodeToken, getSuggestions);
  