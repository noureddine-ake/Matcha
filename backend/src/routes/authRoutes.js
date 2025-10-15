import express from 'express'
import { registrationControler, loginController, verifyEmailControler, resendCode, requestPasswordReset, confirmPasswordReset } from "../controllers/authController.js"
import JWT from '../middlewares/authMiddleware.js'

export const registerRoute = express.Router()

registerRoute.post('/register', registrationControler);
registerRoute.post("/login",loginController)
registerRoute.post('/verify-email', JWT.verifyAndDecodeToken, verifyEmailControler);
registerRoute.post('/resend-code', resendCode);
// Step 1: Request reset link
registerRoute.post('/reset-password/request', requestPasswordReset);
// Step 2: Confirm reset and set new password
registerRoute.post('/reset-password/confirm', confirmPasswordReset);

