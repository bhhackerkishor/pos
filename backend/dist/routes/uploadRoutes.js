import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/multer.js';
import { uploadImage } from '../controllers/uploadController.js';
const router = express.Router();
router.use(protect);
router.use(authorize('admin', 'manager'));
router.post('/image', upload.single('file'), uploadImage);
export default router;
