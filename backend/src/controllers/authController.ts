import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
        expiresIn: '30d'
    });
};

// @desc    Auth user & get token
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            user.lastLogin = new Date();
            await user.save();

            res.json({
                success: true,
                token: generateToken((user._id as any).toString()),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Register a new user
export const register = async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, role });

        res.status(201).json({
            success: true,
            token: generateToken((user._id as any).toString()),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get current logged in user
export const getMe = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
