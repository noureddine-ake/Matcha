import express from 'express'
import { registrationControler, verifyEmailControler, resendCode } from "../controllers/authController.js"
import JWT from '../middlewares/authMiddleware.js'

export const registerRoute = express.Router()

registerRoute.post('/register', registrationControler);
registerRoute.post('/verify-email', JWT.verifyAndDecodeToken, verifyEmailControler);
registerRoute.post('/resend-code', resendCode);
