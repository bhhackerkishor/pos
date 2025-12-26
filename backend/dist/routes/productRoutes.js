import express from 'express';
import { getProducts, getProductByBarcode, createProduct, updateProduct } from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
const router = express.Router();
router.use(protect);
router.route('/')
    .get(getProducts)
    .post(authorize('admin', 'manager'), createProduct);
router.get('/barcode/:barcode', getProductByBarcode);
router.route('/:id')
    .put(authorize('admin', 'manager'), updateProduct);
export default router;
