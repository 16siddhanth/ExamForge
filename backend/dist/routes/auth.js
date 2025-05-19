import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../models/prisma.js';
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });
        // Generate token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET);
        res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
    }
    catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET);
        res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
    }
    catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});
// GET /api/auth/profile
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true, createdAt: true }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
export default router;
//# sourceMappingURL=auth.js.map