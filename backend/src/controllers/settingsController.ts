import { Request, Response } from 'express';
import Settings from '../models/Settings.js';

export const getSettings = async (req: Request, res: Response) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json({ success: true, data: settings });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            const newSettings = await Settings.create(req.body);
            settings = Array.isArray(newSettings) ? newSettings[0] : newSettings;
        } else {
            const updatedSettings = await Settings.findByIdAndUpdate(settings._id, req.body, { new: true, runValidators: true });
            settings = updatedSettings;
        }
        res.json({ success: true, data: settings });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
