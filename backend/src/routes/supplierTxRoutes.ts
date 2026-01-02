import express from 'express';
import { SupplierService } from '../services/SupplierService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/transactions', async (req: any, res: any) => {
    try {
        const tx = await SupplierService.processTransaction(req.body, req.user.id);
        res.status(201).json({ success: true, data: tx });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
