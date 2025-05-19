import { Router } from 'express';
import prisma from '../models/prisma.js';

const router = Router();

// POST /api/sample-papers - Create a sample paper
router.post('/', async (req, res) => {
  try {
    console.log("Received sample paper creation request");
    const { userId, subjectId, title, description, totalMarks, estimatedTime, questions } = req.body;

    console.log("Request data:", { 
      userId, 
      subjectId, 
      title, 
      questionsCount: questions ? questions.length : 0 
    });

    // Validate required fields
    if (!userId) {
      console.warn("Missing userId in sample paper request");
      return res.status(400).json({ error: 'userId is required' });
    }
    
    if (!subjectId) {
      console.warn("Missing subjectId in sample paper request");
      return res.status(400).json({ error: 'subjectId is required' });
    }
    
    if (!title) {
      console.warn("Missing title in sample paper request");
      return res.status(400).json({ error: 'title is required' });
    }
    
    if (!questions) {
      console.warn("Missing questions in sample paper request");
      return res.status(400).json({ error: 'questions are required' });
    }
    
    if (!Array.isArray(questions)) {
      console.warn("Questions is not an array in sample paper request");
      return res.status(400).json({ error: 'questions must be an array' });
    }
    
    if (questions.length === 0) {
      console.warn("Empty questions array in sample paper request");
      return res.status(400).json({ error: 'questions array cannot be empty' });
    }

    // Verify user exists
    console.log("Verifying user exists:", userId);
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      console.warn("User not found:", userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify subject exists
    console.log("Verifying subject exists:", subjectId);
    const subjectExists = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subjectExists) {
      console.warn("Subject not found:", subjectId);
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Format questions to ensure options are stored as strings
    console.log("Processing questions for storage");
    const formattedQuestions = questions.map((q: any) => {
      // Ensure all required fields have values
      const question = {
        text: q.text || 'Untitled question',
        type: q.type || 'multiple-choice',
        options: q.options,
        answer: q.answer || '',
        explanation: q.explanation || '',
        marks: q.marks || 1,
        difficulty: q.difficulty || 'medium',
        topic: q.topic || null
      };
      
      // Ensure options are stored as strings
      if (question.options && typeof question.options !== 'string') {
        question.options = JSON.stringify(question.options);
      }
      
      return question;
    });

    console.log("Creating sample paper in database");
    const samplePaper = await prisma.paper.create({
      data: {
        user: {
          connect: { id: userId }
        },
        subject: {
          connect: { id: subjectId }
        },
        title,
        filePath: 'ai-generated', // Flag to identify AI-generated papers
        pageCount: 0, // Not applicable for AI-generated papers
        uploadDate: new Date(),
        questions: {
          create: formattedQuestions.map((q: any) => ({
            text: q.text,
            type: q.type,
            options: q.options,
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

    console.log("Sample paper created successfully:", samplePaper.id);
    
    // Respond with mapped fields
    res.json({
      id: samplePaper.id,
      title: samplePaper.title,
      subject: samplePaper.subject.name,
      createdAt: samplePaper.uploadDate,
      description: description || "",
      totalMarks: totalMarks || formattedQuestions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0),
      estimatedTime: estimatedTime || 30,
      questions: samplePaper.questions
    });
  } catch (error: any) {
    console.error('Error creating sample paper:', error);
    
    // Return more specific error messages
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found. User or subject may not exist.' });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Unique constraint violation. A paper with this ID already exists.' });
    }
    
    // Return a general error message for other types of errors
    res.status(500).json({ error: 'Error creating sample paper', details: error.message });
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
    const mappedPapers = papers.map(p => {
      // Process the questions to format options properly
      const processedQuestions = p.questions.map(q => {
        // Leave options as is - they'll be processed by QuestionCard component
        return q;
      });

      return {
        id: p.id,
        title: p.title,
        subject: p.subject.name,
        createdAt: p.uploadDate,
        questions: processedQuestions
      };
    });

    res.json(mappedPapers);
  } catch (error) {
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
  } catch (error) {
    console.error('Error deleting sample paper:', error);
    res.status(500).json({ error: 'Error deleting sample paper' });
  }
});

export default router;
