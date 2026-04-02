import express from 'express';
import { reportController } from '../controllers/reportController.ts';
import JWT from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(JWT.verifyAndDecodeToken);

// POST /api/reports/:userId - Report a user
router.post('/:userId', reportController.submitReport);

// GET /api/reports/user/:userId - Get reports for a user (admin use)
router.get('/user/:userId', reportController.getUserReports);

export default router;