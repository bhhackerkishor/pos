import { Request, Response } from 'express';
import cloudinary from '../utils/cloudinary.js';
import fs from 'fs';

export const uploadImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'products',
            resource_type: 'image',
        });

        // remove local temp file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            secure_url: result.secure_url,
            public_id: result.public_id,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Cloudinary upload failed',
        });
    }
};
