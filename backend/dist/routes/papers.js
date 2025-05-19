import axios from "axios";
import express from "express";
import * as fs from "fs";
import path from "path";
// Ensure DOM polyfills are loaded first
import { resetProcessingStatus, upload } from "../middleware/upload.js";
import prisma from "../models/prisma.js";
import "../utils/domPolyfills.js";
import { performOCR } from "../utils/ocr.js";
import { estimatePDFPageCount, validatePDFContent } from "../utils/pdfValidator.js";
const router = express.Router();
// POST /api/papers/upload
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        // Debug log the received request
        console.log("Upload request received:", {
            file: req.file ? { ...req.file, buffer: "[Buffer data]" } : null,
            body: req.body,
            headers: req.headers,
        });
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded." });
        }
        const { title, userId, subjectId } = req.body;
        console.log("Required fields:", { title, userId, subjectId });
        if (!title || !userId || !subjectId) {
            return res.status(400).json({
                error: "Missing required fields.",
                missingFields: {
                    title: !title,
                    userId: !userId,
                    subjectId: !subjectId,
                },
            });
        }
        const filePath = req.file.path;
        const fileExt = path.extname(filePath).toLowerCase();
        // Pre-validate PDF files before attempting to process them
        if (fileExt === ".pdf") {
            console.log("Validating PDF file structure...");
            // Enhanced PDF validation with detailed feedback
            const enhancedValidation = await validatePDFContent(filePath);
            if (!enhancedValidation.isValid) {
                console.error("PDF validation failed:", enhancedValidation.issues);
                // Extract the first error message
                const primaryError = enhancedValidation.issues.find(i => i.severity === 'error')?.message ||
                    "The file may be corrupted or in an unsupported format.";
                return res.status(400).json({
                    error: "Invalid PDF file. " + primaryError,
                    issues: enhancedValidation.issues,
                    recommendations: enhancedValidation.recommendations
                });
            }
            // Include warnings in the response even if we'll proceed with processing
            const warnings = enhancedValidation.issues.filter(i => i.severity === 'warning');
            if (warnings.length > 0) {
                console.warn(`PDF warnings for ${req.file.originalname}:`, warnings);
            }
            console.log("PDF validation passed");
        }
        // Get page count (1 for images and DOCX, actual count for PDFs)
        let pageCount = 1;
        try {
            if (fileExt === ".pdf") {
                pageCount = await estimatePDFPageCount(filePath);
                console.log("PDF page count (estimated):", pageCount);
            }
        }
        catch (pdfError) {
            console.error("Error getting PDF page count:", pdfError);
            return res.status(400).json({
                error: "Unable to process PDF file. The file may be corrupted, password-protected, or in an unsupported format.",
                details: pdfError.message,
            });
        }
        // OCR: Extract text from uploaded file (supports both PDF and images)
        const text = await performOCR(filePath);
        // Call Gemini API to generate questions/answers
        // Use a timeout to prevent hanging requests
        const geminiPromise = axios.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
            process.env.GEMINI_API_KEY, {
            contents: [
                {
                    parts: [
                        {
                            text: `Generate exam questions and answers from this text:\n${text}`,
                        },
                    ],
                },
            ],
        }, { timeout: 50000 });
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("Gemini API request timed out after 50 seconds"));
            }, 50000);
        });
        // Race the promises
        const geminiRes = (await Promise.race([
            geminiPromise,
            timeoutPromise,
        ]));
        // Parse the Gemini response to extract questions
        let questions = [];
        try {
            const responseText = geminiRes.data.candidates[0].content.parts[0].text;
            // Simple parsing - this should be improved with a more robust solution
            // Expected format is JSON array or structured text that can be parsed into questions
            questions = JSON.parse(responseText);
        }
        catch (parseError) {
            console.error("Error parsing Gemini response:", parseError);
            questions = [
                {
                    text: "Question could not be generated automatically. Please edit this question.",
                    type: "multiple-choice",
                    options: JSON.stringify([
                        { id: "1", text: "Option 1", isCorrect: false },
                        { id: "2", text: "Option 2", isCorrect: false },
                        { id: "3", text: "Option 3", isCorrect: true },
                    ]),
                    answer: "Option 3",
                    explanation: "Please add an explanation here.",
                    marks: 1,
                    difficulty: "medium",
                    topic: null,
                },
            ];
        }
        // Store the original file path before deletion for reference
        const originalFilePath = filePath;
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        // Create paper in database with generated questions
        const paper = await prisma.paper.create({
            data: {
                userId,
                subjectId,
                title,
                filePath: `uploaded-${path.basename(originalFilePath)}`, // Store reference to file name
                pageCount,
                uploadDate: new Date(),
                questions: {
                    create: questions.map((q) => ({
                        text: q.text,
                        type: q.type || "multiple-choice",
                        options: q.options
                            ? typeof q.options === "string"
                                ? q.options
                                : JSON.stringify(q.options)
                            : null,
                        answer: q.answer || "",
                        explanation: q.explanation || "",
                        marks: q.marks || 1,
                        difficulty: q.difficulty || "medium",
                        topic: q.topic || null,
                    })),
                },
            },
            include: {
                questions: true,
            },
        });
        res.json(paper);
    }
    catch (error) {
        console.error("Error processing file:", error);
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            }
            catch (unlinkError) {
                console.error("Error deleting file:", unlinkError);
            }
        }
        // Send a more descriptive error message
        const errorMessage = error.message || "Error processing file";
        res.status(500).json({
            error: errorMessage,
            details: process.env.NODE_ENV === "development" ? error.stack : undefined,
        });
    }
    finally {
        // Always reset processing status, even on error
        resetProcessingStatus();
    }
});
// POST /api/papers/generate-questions
router.post("/generate-questions", async (req, res) => {
    try {
        const { subject, count, existingQuestions } = req.body;
        if (!subject) {
            return res.status(400).json({ error: "Subject is required" });
        }
        // Call Gemini API to generate questions for a subject
        const geminiRes = await axios.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
            process.env.GEMINI_API_KEY, {
            contents: [
                {
                    parts: [
                        {
                            text: `Generate ${count || 5} exam questions and answers for subject: ${subject}. ${existingQuestions ? `Existing questions: ${JSON.stringify(existingQuestions)}` : ""}`,
                        },
                    ],
                },
            ],
        });
        // Parse the response
        try {
            const responseText = geminiRes.data.candidates[0].content.parts[0].text;
            const parsedQuestions = JSON.parse(responseText);
            res.json({ questions: parsedQuestions });
        }
        catch (parseError) {
            console.error("Error parsing Gemini response:", parseError);
            res.status(500).json({
                error: "Failed to parse AI-generated questions",
                rawResponse: geminiRes.data,
            });
        }
    }
    catch (err) {
        console.error("Error generating questions:", err);
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        }
        else {
            res.status(500).json({ error: "An unknown error occurred." });
        }
    }
});
// GET /api/papers - List all papers, optionally filtered by subjectId
router.get("/", async (req, res) => {
    const { subjectId } = req.query;
    const whereClause = {};
    if (subjectId) {
        whereClause.subjectId = String(subjectId);
    }
    const papers = await prisma.paper.findMany({
        where: whereClause,
        include: { subject: true, questions: true },
    });
    res.json(papers);
});
// GET /api/papers/:id
router.get("/:id", (req, res) => {
    // TODO: Get single paper
    res.send("Get paper endpoint");
});
// DELETE /api/papers/:id - Delete a paper
router.delete("/:id", async (req, res) => {
    try {
        await prisma.paper.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message });
        }
        else {
            res.status(400).json({ error: "An unknown error occurred." });
        }
    }
});
export default router;
//# sourceMappingURL=papers.js.map