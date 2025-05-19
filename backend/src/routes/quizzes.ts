import axios from 'axios';
import express from 'express';
import prisma from '../models/prisma.js';

/**
 * Maps a question type string from the database to the allowed enum values
 * @param type The question type from the database
 * @returns A valid question type for the QuizQuestion interface
 */
function mapQuestionType(type: string): "multiple-choice" | "short-answer" | "long-answer" {
  if (!type) {
    console.warn('Empty question type received, defaulting to short-answer');
    return "short-answer";
  }

  switch(type.toLowerCase().trim()) {
    case 'multiple-choice':
    case 'multiple choice':
    case 'mcq':
    case 'multi-choice':
    case 'multichoice':
      return "multiple-choice";
    case 'short-answer':
    case 'short answer':
    case 'short':
    case 'brief':
      return "short-answer";
    case 'long-answer':
    case 'long answer':
    case 'long':
    case 'essay':
    case 'extended':
      return "long-answer";
    default:
      // Default to short-answer if type is unknown
      console.warn(`Unknown question type: "${type}", defaulting to short-answer`);
      return "short-answer";
  }
}

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

    const quizWithParsedQuestions = quizzes.map((quiz: Quiz) => {
      try {
        return {
          ...quiz,
          questions: JSON.parse(quiz.questions) as QuizData
        };
      } catch (e) {
        console.error(`Error parsing questions for quiz ${quiz.id}:`, e);
        // Return quiz with empty questions array to prevent breaking the client
        return {
          ...quiz,
          questions: { questions: [], timeSpent: 0, subjectId: quiz.id } as QuizData
        };
      }
    });

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
    let quizWithParsedQuestions;
    try {
      quizWithParsedQuestions = {
        ...quiz,
        questions: JSON.parse(quiz.questions as string) as QuizData
      };
    } catch (e) {
      console.error(`Error parsing questions for latest quiz ${quiz.id}:`, e);
      // Provide a valid default structure if parsing fails
      quizWithParsedQuestions = {
        ...quiz,
        questions: { questions: [], timeSpent: 0, subjectId: quiz.id } as QuizData
      };
    }

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
      .flatMap((doc) => doc.questions)
      .filter((q) => {
        if (!topic) return true; // Include all questions if no topic specified
        
        // Check if question has a topic and if it matches (case-insensitive)
        const questionTopic = (q.topic || '').trim().toLowerCase();
        const searchTopic = topic.trim().toLowerCase();
        return questionTopic === searchTopic;
      })
      .map(question => {
        // Convert question from database format to QuizQuestion format
        return {
          ...question,
          // Ensure type is one of the allowed enum values
          type: mapQuestionType(question.type),
          // Parse options if they exist and handle parsing errors
          options: question.options ? (() => {
            try {
              return JSON.parse(question.options as string);
            } catch (e) {
              console.warn(`Failed to parse options for question ${question.id}:`, e);
              return undefined;
            }
          })() : undefined
        } as QuizQuestion;
      });

    if (existingQuestions.length === 0) {
      return res.status(404).json({ error: 'No questions found for the selected criteria' });
    }

    // Group questions by topic for better context
    const questionsByTopic = existingQuestions.reduce((acc: { [key: string]: QuizQuestion[] }, q: QuizQuestion) => {
      // Ensure we have a valid topic key, defaulting to 'general' if undefined or empty
      const topicKey = (q.topic && q.topic.trim()) ? q.topic.trim() : 'general';
      if (!acc[topicKey]) acc[topicKey] = [];
      acc[topicKey].push(q);
      return acc;
    }, {});

    // Generate quiz using Gemini API with improved context
    let response;
    try {
      // Format the API key correctly - removing any quotes if present
      const apiKey = process.env.GEMINI_API_KEY?.replace(/["']/g, '') || '';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      response = await axios.post(
        apiUrl,
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
          },
          timeout: 30000 // 30-second timeout
        }
      );
    } catch (apiError: any) {
      console.error('Error calling Gemini API:', apiError);
      // Check if it's an Axios error with a response
      if (apiError.response) {
        return res.status(apiError.response.status || 500).json({ 
          error: `Gemini API error: ${apiError.response.data?.error?.message || 'Unknown error'}` 
        });
      }
      // Handle timeout or network errors
      if (apiError.code === 'ECONNABORTED') {
        return res.status(504).json({ error: 'Quiz generation timed out. Please try again.' });
      }
      return res.status(500).json({ error: 'Failed to generate quiz questions. Please try again later.' });
    }

    if (!response?.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return res.status(500).json({ error: 'Invalid response from Gemini API' });
    }

    // Parse and validate generated questions
    const jsonStr = response.data.candidates[0].content.parts[0].text;
    let generatedQuestions;
    
    try {
      // Try to parse the entire response as JSON first
      generatedQuestions = JSON.parse(jsonStr);
      
      // Validate the structure of the generated questions
      if (!Array.isArray(generatedQuestions)) {
        throw new Error('Generated content is not an array of questions');
      }
      
      if (generatedQuestions.length === 0) {
        throw new Error('No questions were generated');
      }
    } catch (e) {
      console.error('Initial JSON parsing failed:', e);
      // If that fails, try to extract JSON array using regex
      try {
        const startIdx = jsonStr.indexOf('[');
        const endIdx = jsonStr.lastIndexOf(']') + 1;
        if (startIdx >= 0 && endIdx > startIdx) {
          const cleanJson = jsonStr.slice(startIdx, endIdx);
          generatedQuestions = JSON.parse(cleanJson);
        } else {
          throw new Error('Could not find JSON array in response');
        }
      } catch (extractError) {
        console.error('Error parsing generated questions:', extractError);
        throw new Error('Failed to parse generated questions from API response');
      }
    }

    // Add unique IDs
    generatedQuestions = generatedQuestions.map((q: QuizQuestion) => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9),
      // Make sure type is valid and matches our enum
      type: mapQuestionType(q.type || 'short-answer'),
      // Ensure options have IDs
      options: q.options?.map(opt => ({
        ...opt,
        id: Math.random().toString(36).substr(2, 9)
      }))
    }));

    // Ensure we have questions to work with
    if (!generatedQuestions || generatedQuestions.length === 0) {
      return res.status(500).json({ error: 'Failed to generate valid questions. Please try again.' });
    }

    res.json({ questions: generatedQuestions });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Error generating quiz questions' });
  }
});

export default router;
