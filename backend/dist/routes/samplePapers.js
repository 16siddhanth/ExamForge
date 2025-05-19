import { Router } from 'express';
import prisma from '../models/prisma.js';
const router = Router();
// POST /api/sample-papers - Create a sample paper
router.post('/', async (req, res) => {
    try {
        const { userId, subjectId, title, description, totalMarks, estimatedTime, questions } = req.body;
        const samplePaper = await prisma.paper.create({
            data: {
                userId,
                subjectId,
                title,
                filePath: 'ai-generated', // Flag to identify AI-generated papers
                pageCount: 0, // Not applicable for AI-generated papers
                questions: {
                    create: questions.map((q) => ({
                        text: q.text,
                        type: q.type,
                        options: q.options ? JSON.stringify(q.options) : null,
                        answer: q.answer,
                        explanation: q.explanation,
                        marks: q.marks || null,
                        difficulty: q.difficulty || 'medium',
                        topic: q.topic || null
                    }))
                }
            },
            include: {
                questions: true,
                subject: true
            }
        });
        // Respond with mapped fields
        res.json({
            id: samplePaper.id,
            title: samplePaper.title,
            subject: samplePaper.subject.name,
            createdAt: samplePaper.uploadDate,
            questions: samplePaper.questions
        });
    }
    catch (error) {
        console.error('Error creating sample paper:', error);
        res.status(500).json({ error: 'Error creating sample paper' });
    }
});
// GET /api/sample-papers - Get all sample papers for a subject
router.get('/', async (req, res) => {
    try {
        const { subjectId } = req.query;
        const papers = await prisma.paper.findMany({
            where: {
                subjectId: String(subjectId),
                filePath: 'ai-generated' // Only get AI-generated papers
            },
            include: {
                questions: true,
                subject: true
            },
            orderBy: { uploadDate: 'desc' }
        });
        // Map fields for frontend
        res.json(papers.map(p => ({
            id: p.id,
            title: p.title,
            subject: p.subject.name,
            createdAt: p.uploadDate,
            questions: p.questions
        })));
    }
    catch (error) {
        console.error('Error getting sample papers:', error);
        res.status(500).json({ error: 'Error getting sample papers' });
    }
});
// DELETE /api/sample-papers/:id - Delete a sample paper
router.delete('/:id', async (req, res) => {
    try {
        await prisma.paper.delete({
            where: {
                id: req.params.id,
                filePath: 'ai-generated' // Extra check to ensure we only delete AI-generated papers
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting sample paper:', error);
        res.status(500).json({ error: 'Error deleting sample paper' });
    }
});
export default router;
//# sourceMappingURL=samplePapers.js.map