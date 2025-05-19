import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
// Import DOM polyfills early to ensure they're available for PDF processing
import './utils/domPolyfills.js';

import authRoutes from './routes/auth.js';
import ocrRoutes from './routes/ocr.js';
import paperRoutes from './routes/papers.js';
import questionRoutes from './routes/questions.js';
import quizRoutes from './routes/quizzes.js';
import samplePapersRoutes from './routes/samplePapers.js';
import statsRoutes from './routes/stats.js';
import subjectRoutes from './routes/subjects.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();

// Configure CORS with more specific settings
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/sample-papers', samplePapersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ocr', ocrRoutes);

app.get('/', (req, res) => {
  res.send('ExamForge backend is running!');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
