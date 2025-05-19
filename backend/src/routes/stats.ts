import { Router } from 'express';
import prisma from '../models/prisma.js';

const router = Router();

// GET /api/subjects/popular - Get most used topics across all papers
router.get('/popular', async (req, res) => {
  try {
    // Get all questions with topics
    const questions = await prisma.question.findMany({
      where: {
        topic: {
          not: null
        }
      },
      select: {
        topic: true
      }
    });

    // Count occurrences of each topic
    const topicCounts = questions.reduce((acc: { [key: string]: number }, question) => {
      if (question.topic) {
        acc[question.topic] = (acc[question.topic] || 0) + 1;
      }
      return acc;
    }, {});

    // Sort topics by frequency
    const sortedTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([topic]) => topic);

    res.json({ topics: sortedTopics });
  } catch (error) {
    console.error('Error getting popular topics:', error);
    res.status(500).json({ error: 'Error getting popular topics' });
  }
});

export default router;
