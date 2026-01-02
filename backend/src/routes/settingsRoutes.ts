import express from 'express';
import {
    getSettings,
    updateSettings
} from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(getSettings)
    .post(updateSettings)
    .put(updateSettings);

export default router;
