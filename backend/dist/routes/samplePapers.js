"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../models/prisma"));
const router = express_1.default.Router();
// GET /api/sample-papers?subjectId=... - List all sample papers for a subject
router.get('/', async (req, res) => {
    const { subjectId } = req.query;
    const where = subjectId ? { subjectId: String(subjectId) } : {};
    const samplePapers = await prisma_1.default.samplePaper.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { subject: true, user: true },
    });
    res.json(samplePapers);
});
// POST /api/sample-papers - Create a new sample paper
router.post('/', async (req, res) => {
    try {
        const { userId, subjectId, title, description, totalMarks, estimatedTime, questions } = req.body;
        const samplePaper = await prisma_1.default.samplePaper.create({
            data: {
                userId,
                subjectId,
                title,
                description,
                totalMarks,
                estimatedTime,
                questions: JSON.stringify(questions),
            },
        });
        res.json(samplePaper);
    }
    catch (err) {
        const message = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
        res.status(400).json({ error: message });
    }
});
// GET /api/sample-papers/:id - Get a single sample paper
router.get('/:id', async (req, res) => {
    try {
        const samplePaper = await prisma_1.default.samplePaper.findUnique({
            where: { id: req.params.id },
            include: { subject: true, user: true },
        });
        if (!samplePaper)
            return res.status(404).json({ error: 'Not found' });
        res.json(samplePaper);
    }
    catch (err) {
        const message = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
        res.status(400).json({ error: message });
    }
});
// DELETE /api/sample-papers/:id - Delete a sample paper
router.delete('/:id', async (req, res) => {
    try {
        await prisma_1.default.samplePaper.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (err) {
        const message = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
        res.status(400).json({ error: message });
    }
});
exports.default = router;
