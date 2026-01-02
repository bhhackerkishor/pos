import express from 'express';
import { getSuppliers, createSupplier, getSupplierById, updateSupplier } from '../controllers/supplierController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getSuppliers)
    .post(createSupplier);

router.route('/:id')
    .get(getSupplierById)
    .put(updateSupplier);

export default router;
