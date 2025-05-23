import { Router } from 'express';
import prisma from '../models/prisma.js';
const router = Router();
router.get('/', async (req, res) => {
    try {
        const subjects = await prisma.subject.findMany();
        // Parse mainTopics back to array when sending response
        const subjectsWithParsedTopics = subjects.map((subject) => ({
            ...subject,
            mainTopics: JSON.parse(subject.mainTopics)
        }));
        res.json(subjectsWithParsedTopics);
    }
    catch (err) {
        const message = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
        res.status(400).json({ error: message });
    }
});
router.post('/', async (req, res) => {
    const { name, mainTopics } = req.body;
    try {
        const subject = await prisma.subject.create({
            data: {
                name,
                mainTopics: JSON.stringify(mainTopics) // Store as JSON string
            },
        });
        // Parse mainTopics back to array in response
        res.json({
            ...subject,
            mainTopics: JSON.parse(subject.mainTopics)
        });
    }
    catch (err) {
        const message = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
        res.status(400).json({ error: message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const subject = await prisma.subject.findUnique({
            where: { id: String(req.params.id) }
        });
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        // Parse mainTopics back to array in response
        res.json({
            ...subject,
            mainTopics: JSON.parse(subject.mainTopics)
        });
    }
    catch (err) {
        const message = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
        res.status(400).json({ error: message });
    }
});
router.put('/:id', async (req, res) => {
    const { name, mainTopics } = req.body;
    try {
        const subject = await prisma.subject.update({
            where: { id: String(req.params.id) },
            data: {
                name,
                mainTopics: JSON.stringify(mainTopics) // Store as JSON string
            },
        });
        // Parse mainTopics back to array in response
        res.json({
            ...subject,
            mainTopics: JSON.parse(subject.mainTopics)
        });
    }
    catch (err) {
        const message = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
        res.status(400).json({ error: message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await prisma.subject.delete({ where: { id: String(req.params.id) } });
        res.json({ success: true });
    }
    catch (err) {
        const message = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
        res.status(400).json({ error: message });
    }
});
export default router;
//# sourceMappingURL=subjects.js.map