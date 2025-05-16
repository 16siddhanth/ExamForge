import { Question } from '@prisma/client';
import express from 'express';
import prisma from '../models/prisma';

const router = express.Router();

// POST /api/questions - Store generated questions
router.post('/', async (req, res) => {
  try {
    const { questions, paperId } = req.body;

    const createdQuestions = await Promise.all(
      questions.map((q: Omit<Question, 'id'>) =>
        prisma.question.create({
          data: {
            ...q,
            paperId,
            options: q.options ? JSON.stringify(q.options) : null
          }
        })
      )
    );

    res.json(createdQuestions);
  } catch (error) {
    res.status(500).json({ error: 'Error storing questions' });
  }
});

// GET /api/questions/:paperId - Get questions for a paper
router.get('/:paperId', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      where: { paperId: req.params.paperId },
      orderBy: { id: 'asc' }
    });

    // Parse options JSON for each question
    const questionsWithParsedOptions = questions.map(q => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null
    }));

    res.json(questionsWithParsedOptions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching questions' });
  }
});

// PUT /api/questions/:id - Update a question
router.put('/:id', async (req, res) => {
  try {
    const { text, type, options, answer, explanation, marks, difficulty, topic } = req.body;

    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: {
        text,
        type,
        options: options ? JSON.stringify(options) : null,
        answer,
        explanation,
        marks,
        difficulty,
        topic
      }
    });

    res.json({
      ...question,
      options: question.options ? JSON.parse(question.options) : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating question' });
  }
});

// DELETE /api/questions/:id - Delete a question
router.delete('/:id', async (req, res) => {
  try {
    await prisma.question.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting question' });
  }
});

export default router;
