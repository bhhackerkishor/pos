import express from 'express';
import { getDashboardStats, getSalesChart, getDetailedAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/stats', getDashboardStats);
router.get('/chart', getSalesChart);
router.get('/detailed', getDetailedAnalytics);

export default router;
