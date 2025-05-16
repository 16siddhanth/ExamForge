import axios from 'axios';
import express, { Request, Response } from 'express';
import * as fs from 'fs';
import path from 'path';
import { upload } from '../middleware/upload';
import prisma from '../models/prisma';
import { performOCR } from '../utils/ocr';
import { getPDFPageCount } from '../utils/pdfToImage';

const router = express.Router();

// POST /api/papers/upload
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { title, userId, subjectId } = req.body;
    if (!title || !userId || !subjectId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Get page count (1 for images, actual count for PDFs)
    const pageCount = fileExt === '.pdf' ? await getPDFPageCount(filePath) : 1;

    // OCR: Extract text from uploaded file (supports both PDF and images)
    const text = await performOCR(filePath);

    // Call Gemini API to generate questions/answers
    const geminiRes = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [{
          parts: [{ text: `Generate exam questions and answers from this text:\n${text}` }]
        }]
      }
    );

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Create paper in database with generated questions
    const paper = await prisma.paper.create({
      data: {
        userId,
        subjectId,
        title,
        filePath,
        pageCount,
        uploadDate: new Date(),
        questions: {
          create: geminiRes.data.questions.map((q: any) => ({
            text: q.text,
            type: q.type || 'multiple-choice',
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
        questions: true
      }
    });

    res.json(paper);
  } catch (error: any) {
    console.error('Error processing file:', error);
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: 'Error processing file', 
      details: error.message 
    });
  }
});

// POST /api/papers/generate-questions
router.post('/generate-questions', async (req, res) => {
  try {
    const { subject, count, existingQuestions } = req.body;
    // Call Gemini API to generate questions for a subject
    const geminiRes = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [{
          parts: [{ text: `Generate ${count} exam questions and answers for subject: ${subject}. Existing questions: ${JSON.stringify(existingQuestions)}` }]
        }]
      }
    );
    res.json({ questions: geminiRes.data });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
});

// GET /api/papers - List all papers
router.get('/', async (req, res) => {
  const papers = await prisma.paper.findMany({ include: { subject: true, questions: true } });
  // Fix: Prisma v5+ uses 'subject' relation as 'Subject' (capitalized) if model is Subject
  // If error persists, use 'include: { Subject: true, questions: true }' or check generated Prisma types
  res.json(papers);
});

// GET /api/papers/:id
router.get('/:id', (req, res) => {
  // TODO: Get single paper
  res.send('Get paper endpoint');
});

// DELETE /api/papers/:id - Delete a paper
router.delete('/:id', async (req, res) => {
  try {
    await prisma.paper.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(400).json({ error: 'An unknown error occurred.' });
    }
  }
});

export default router;
