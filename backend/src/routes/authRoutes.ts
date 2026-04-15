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
import {
  validateRegistrationMiddleware, 
  validateLoginMiddleware,
  validatePasswordMiddleware 
} from '../middlewares/validationMiddleware.js';
import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express'

export const registerRoute = express.Router();

// express-validator chain to sanitize / normalize registration inputs
const registrationValidation = [
  body('email').isEmail().normalizeEmail(),
  body('username').trim().escape(),
  body('password').isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  body('firstName').trim().escape(),
  body('lastName').trim().escape(),
];

// helper to run validationResult after express-validator checks
const runValidators = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

registerRoute.post(
  '/register',
  registrationValidation,
  runValidators,
  validateRegistrationMiddleware,
  validatePasswordMiddleware,
  registrationControler
);
registerRoute.post('/login', validateLoginMiddleware, loginController);
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
// Step 2: Confirm reset and set new password (with password validation)
registerRoute.post('/reset-password/confirm', validatePasswordMiddleware, confirmPasswordReset);
// Refresh token endpoint
registerRoute.post('/refresh', refreshTokenController);
