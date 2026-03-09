import express from 'express';
import {
  requestEmailUpdate,
  verifyPendingEmail,
  cancelEmailUpdate,
  getPendingEmailStatus,
} from '../controllers/emailUpdateController.js';
import JWT from '../middlewares/authMiddleware.js';

export const emailUpdateRoute = express.Router();

emailUpdateRoute.post('/request', JWT.verifyAndDecodeToken, requestEmailUpdate);
emailUpdateRoute.post('/verify', verifyPendingEmail);
emailUpdateRoute.post('/cancel', JWT.verifyAndDecodeToken, cancelEmailUpdate);
emailUpdateRoute.get('/status', JWT.verifyAndDecodeToken, getPendingEmailStatus);
