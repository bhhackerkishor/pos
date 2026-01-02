import express from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getCategories)
    .post(authorize('admin', 'manager'), createCategory);

router.route('/:id')
    .put(authorize('admin', 'manager'), updateCategory)
    .delete(authorize('admin', 'manager'), deleteCategory);

export default router;
