import express from 'express';
import { createSale, getSales, getSaleById } from '../controllers/saleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getSales)
    .post(createSale);

router.get('/:id', getSaleById);

export default router;
