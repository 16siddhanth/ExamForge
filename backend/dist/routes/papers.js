"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const express_1 = __importDefault(require("express"));
const fs = __importStar(require("fs"));
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const upload_1 = require("../middleware/upload");
const prisma_1 = __importDefault(require("../models/prisma"));
const router = express_1.default.Router();
// POST /api/papers/upload
router.post('/upload', upload_1.upload.single('file'), (req, res) => {
    (async () => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded.' });
            }
            const filePath = req.file.path;
            // OCR: Extract text from uploaded file
            const { data: { text } } = await tesseract_js_1.default.recognize(filePath, 'eng');
            // Call Gemini API to generate questions/answers
            const geminiRes = await axios_1.default.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY, {
                contents: [{
                        parts: [{ text: `Generate exam questions and answers from this text:\n${text}` }]
                    }]
            });
            // Clean up uploaded file
            fs.unlinkSync(filePath);
            // Return questions/answers to frontend
            res.json({ questions: geminiRes.data });
        }
        catch (err) {
            if (err instanceof Error) {
                res.status(500).json({ error: err.message });
            }
            else {
                res.status(500).json({ error: 'An unknown error occurred.' });
            }
        }
    })();
});
// POST /api/papers/generate-questions
router.post('/generate-questions', async (req, res) => {
    try {
        const { subject, count, existingQuestions } = req.body;
        // Call Gemini API to generate questions for a subject
        const geminiRes = await axios_1.default.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY, {
            contents: [{
                    parts: [{ text: `Generate ${count} exam questions and answers for subject: ${subject}. Existing questions: ${JSON.stringify(existingQuestions)}` }]
                }]
        });
        res.json({ questions: geminiRes.data });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred.' });
        }
    }
});
// GET /api/papers - List all papers
router.get('/', async (req, res) => {
    const papers = await prisma_1.default.paper.findMany({ include: { subject: true, questions: true } });
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
        await prisma_1.default.paper.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message });
        }
        else {
            res.status(400).json({ error: 'An unknown error occurred.' });
        }
    }
});
exports.default = router;
