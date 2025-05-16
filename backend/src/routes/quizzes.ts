import axios from 'axios';
import express from 'express';
import prisma from '../models/prisma';

interface QuizQuestion {
  id: string;
  text: string;
  type: "multiple-choice" | "short-answer" | "long-answer";
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  answer?: string;
  explanation?: string;
  marks?: number;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
}

interface QuizData {
  questions: QuizQuestion[];
  timeSpent: number;
  subjectId: string;
}

interface Quiz {
  id: string;
  userId: string;
  title: string;
  score: number;
  date: Date;
  questions: string;
}

interface Paper {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  filePath: string;
  uploadDate: Date;
  pageCount: number;
  questions: QuizQuestion[];
}

const router = express.Router();

// POST /api/quizzes - Store quiz attempt
router.post('/', async (req, res) => {
  try {
    const { userId, subjectId, title, questions, score, timeSpent } = req.body;

    const quiz = await prisma.quiz.create({
      data: {
        userId,
        title,
        score,
        date: new Date(),
        questions: JSON.stringify({
          questions,
          timeSpent,
          subjectId
        })
      }
    });

    res.json(quiz);
  } catch (error) {
    console.error('Error storing quiz:', error);
    res.status(500).json({ error: 'Error storing quiz attempt' });
  }
});

// GET /api/quizzes/:userId - Get quiz history for user
router.get('/:userId', async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { userId: req.params.userId },
      orderBy: { date: 'desc' }
    });

    const quizWithParsedQuestions = quizzes.map((quiz: Quiz) => ({
      ...quiz,
      questions: JSON.parse(quiz.questions) as QuizData
    }));

    res.json(quizWithParsedQuestions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching quiz history' });
  }
});

// GET /api/quizzes/:userId/latest - Get user's latest quiz
router.get('/:userId/latest', async (req, res) => {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: { userId: req.params.userId },
      orderBy: { date: 'desc' }
    });

    if (!quiz) {
      return res.json(null);
    }

    // Parse questions JSON
    const quizWithParsedQuestions = {
      ...quiz,
      questions: JSON.parse(quiz.questions as string) as QuizData
    };

    res.json(quizWithParsedQuestions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching latest quiz' });
  }
});

// POST /api/quizzes/generate - Generate quiz questions for a subject
router.post('/generate', async (req, res) => {
  try {
    const { subjectId, topic } = req.body;

    // Get subject details and related papers
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        documents: {
          include: {
            questions: {
              where: topic ? { topic } : {}
            }
          }
        }
      }
    });

    if (!subject || subject.documents.length === 0) {
      return res.status(404).json({ error: 'No papers found for this subject' });
    }

    // Collect all relevant questions
    const existingQuestions = subject.documents
      .flatMap((doc: Paper) => doc.questions)
      .filter((q: QuizQuestion) => !topic || q.topic === topic);

    if (existingQuestions.length === 0) {
      return res.status(404).json({ error: 'No questions found for the selected criteria' });
    }

    // Group questions by topic for better context
    const questionsByTopic = existingQuestions.reduce((acc: { [key: string]: QuizQuestion[] }, q: QuizQuestion) => {
      const topicKey = q.topic || 'general';
      if (!acc[topicKey]) acc[topicKey] = [];
      acc[topicKey].push(q);
      return acc;
    }, {});

    // Generate quiz using Gemini API with improved context
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [{
          parts: [{
            text: `Generate 10 exam questions for the subject "${subject.name}".
            Topic focus: ${topic || 'various topics'}
            
            Use these existing questions as context for style and difficulty:
            ${Object.entries(questionsByTopic)
              .map(([topicName, questions]) => (
                `Topic: ${topicName}\nExample questions:\n${(questions as QuizQuestion[])
                  .slice(0, 2)
                  .map((q: QuizQuestion) => `- ${q.text}`)
                  .join('\n')}`
              ))
              .join('\n\n')}
            
            Generate a mix of:
            - Multiple-choice questions (60%)
            - Short-answer questions (40%)
            
            Each question should have:
            - text: Clear question text
            - type: "multiple-choice" or "short-answer"
            - options: For multiple-choice, array of {text, isCorrect}
            - answer: Correct answer text
            - explanation: Detailed explanation
            - difficulty: "easy", "medium", or "hard"
            - topic: Specific topic name
            - marks: 1-5 based on complexity
            
            Return as JSON array.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
        }
      }
    );

    // Parse and validate generated questions
    const jsonStr = response.data.candidates[0].content.parts[0].text;
    const startIdx = jsonStr.indexOf('[');
    const endIdx = jsonStr.lastIndexOf(']') + 1;
    const cleanJson = jsonStr.slice(startIdx, endIdx);
    let generatedQuestions = JSON.parse(cleanJson);

    // Add unique IDs
    generatedQuestions = generatedQuestions.map((q: QuizQuestion) => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9),
      options: q.options?.map(opt => ({
        ...opt,
        id: Math.random().toString(36).substr(2, 9)
      }))
    }));

    res.json({ questions: generatedQuestions });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Error generating quiz questions' });
  }
});

export default router;
