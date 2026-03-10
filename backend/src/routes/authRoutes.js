import express from 'express';
import {
  registrationControler,
  loginController,
  verifyEmailControler,
  verifyEmailByToken,
  resendCode,
  resendVerificationPublic,
  requestPasswordReset,
  confirmPasswordReset,
  refreshTokenController,
  logoutController,
} from '../controllers/authController.js';
import JWT from '../middlewares/authMiddleware.js';

export const registerRoute = express.Router();

registerRoute.post('/register', registrationControler);
registerRoute.post('/login', loginController);
registerRoute.post('/logout', logoutController);
registerRoute.post(
  '/verify-email',
  JWT.verifyAndDecodeToken,
  verifyEmailControler
);
registerRoute.post('/verify-email/token', verifyEmailByToken);

registerRoute.post('/resend-code', JWT.verifyAndDecodeToken, resendCode);
registerRoute.post('/resend-verification', resendVerificationPublic);
// Step 1: Request reset link
registerRoute.post('/reset-password/request', requestPasswordReset);
// Step 2: Confirm reset and set new password
registerRoute.post('/reset-password/confirm', confirmPasswordReset);
// Refresh token endpoint
registerRoute.post('/refresh', refreshTokenController);
