import axios from "axios";
import express, { Request, Response } from "express";
import * as fs from "fs";
import path from "path";
// Ensure DOM polyfills are loaded first
import { resetProcessingStatus, upload } from "../middleware/upload.js";
import prisma from "../models/prisma.js";
import "../utils/domPolyfills.js";
import { performOCR } from "../utils/ocr.js";
import { estimatePDFPageCount, validatePDFContent } from "../utils/pdfValidator.js";

const router = express.Router();

// Endpoint to test Gemini API connection
router.get("/test-api", async (req, res) => {
  try {
    console.log("Testing Gemini API connection...");
    
    // Format the API key correctly - removing any quotes if present
    const apiKey = process.env.GEMINI_API_KEY?.replace(/["']/g, '') || '';
    
    if (!apiKey) {
      console.log("API key is missing");
      return res.status(400).json({ error: "API key is not set. Please check .env file." });
    }
    
    console.log("API key exists (first 5 chars):", apiKey.substring(0, 5) + "...");
    
    // Build the URL with the correct model format
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    console.log("Using API URL:", apiUrl.substring(0, 75) + "...[key hidden]");
    
    // Simple test prompt
    try {
      const response = await axios.post(
        apiUrl,
        {
          contents: [
            {
              parts: [
                {
                  text: "Say hello world",
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log("API test successful!");
      console.log("Response status:", response.status);
      console.log("Response headers:", JSON.stringify(response.headers, null, 2));
      console.log("Response data sample:", JSON.stringify(response.data).substring(0, 200) + "...");
      
      return res.json({ 
        success: true, 
        message: "Gemini API is working properly", 
        data: {
          modelResponse: response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text"
        }
      });
    } catch (apiError: any) {
      console.error("API request failed:", apiError.message);
      
      // Log more details about the error
      if (apiError.response) {
        console.error("Response status:", apiError.response.status);
        console.error("Response headers:", apiError.response.headers);
        console.error("Response data:", apiError.response.data);
      } else if (apiError.request) {
        console.error("No response received. Request details:", apiError.request);
      }
      
      throw apiError; // Re-throw for the outer catch block
    }
  } catch (error: any) {
    console.error("API test failed:", error.message);
    
    // Return detailed error information
    return res.status(500).json({
      success: false,
      error: "Gemini API test failed",
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
});

// POST /api/papers/upload
router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
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
      } catch (pdfError: any) {
        console.error("Error getting PDF page count:", pdfError);
        return res.status(400).json({
          error:
            "Unable to process PDF file. The file may be corrupted, password-protected, or in an unsupported format.",
          details: pdfError.message,
        });
      }

      // OCR: Extract text from uploaded file (supports both PDF and images)
      const text = await performOCR(filePath);

      // Call Gemini API to generate questions/answers
      // Use a timeout to prevent hanging requests
      let geminiRes;
      try {
        // Format the API key correctly - removing any quotes if present
        const apiKey = process.env.GEMINI_API_KEY?.replace(/["']/g, '') || '';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const geminiPromise = axios.post(
          apiUrl,
          {
            contents: [
              {
                parts: [
                  {
                    text: `Generate exam questions and answers from this text:\n${text}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          },
          { 
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 50000 
          }
        );

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Gemini API request timed out after 50 seconds"));
          }, 50000);
        });

        // Race the promises
        geminiRes = (await Promise.race([
          geminiPromise,
          timeoutPromise,
        ])) as any;
      } catch (apiError) {
        console.log("Gemini API error, using mock questions:", apiError);
        // Create mock response when API call fails
        geminiRes = {
          data: {
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify([
                        {
                          text: "What is the main purpose of this document?",
                          type: "multiple-choice",
                          options: JSON.stringify([
                            { id: "1", text: "Educational assessment", isCorrect: true },
                            { id: "2", text: "Legal documentation", isCorrect: false },
                            { id: "3", text: "Technical specification", isCorrect: false },
                          ]),
                          answer: "Educational assessment",
                          explanation: "Based on the document context.",
                          marks: 2,
                          difficulty: "medium",
                          topic: req.body.subject
                        },
                        {
                          text: "Which subject does this exam paper cover?",
                          type: "multiple-choice",
                          options: JSON.stringify([
                            { id: "1", text: "Mathematics", isCorrect: false },
                            { id: "2", text: "Science", isCorrect: false },
                            { id: "3", text: "Cannot be determined from extract", isCorrect: true },
                          ]),
                          answer: "Cannot be determined from extract",
                          explanation: "The subject cannot be clearly determined from the text.",
                          marks: 1,
                          difficulty: "easy",
                          topic: req.body.subject
                        }
                      ])
                    }
                  ]
                }
              }
            ]
          }
        };
      }

      // Parse the Gemini response to extract questions
      let questions: any[] = [];
      try {
        const responseText = geminiRes.data.candidates[0].content.parts[0].text;
        let parsedQuestions: any[] = [];
        try {
          // First try to parse as JSON
          parsedQuestions = JSON.parse(responseText);
        } catch (jsonError) {
          console.error("Failed to parse response as JSON, attempting text extraction");
          // If JSON parsing fails, try to extract JSON-like structures from the text
          const potentialJsonMatch = responseText.match(/\[[\s\S]*\]/);
          if (potentialJsonMatch) {
            try {
              parsedQuestions = JSON.parse(potentialJsonMatch[0]);
            } catch (e) {
              // Try to handle the case where Gemini returns markdown-formatted JSON
              if (responseText.includes("```json")) {
                const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonBlockMatch && jsonBlockMatch[1]) {
                  try {
                    parsedQuestions = JSON.parse(jsonBlockMatch[1]);
                  } catch (markdownError) {
                    console.error("Failed to parse JSON from markdown block:", markdownError);
                  }
                }
              }
              
              // If we still don't have valid questions, fall back to a simple format
              if (!parsedQuestions) {
                // Create a structured format from unstructured text
                console.log("Attempting to structure non-JSON response");
                const lines: string[] = responseText.split('\n').filter((line: string) => line.trim());
                
                // Look for questions that might be in a numbered format (1. Question text)
                const questionsArray: any[] = [];
                let currentQuestion: any = null;
                
                for (const line of lines) {
                  const questionMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
                  if (questionMatch) {
                    if (currentQuestion) {
                      questionsArray.push(currentQuestion);
                    }
                    currentQuestion = {
                      text: questionMatch[2],
                      type: "multiple-choice",
                      options: JSON.stringify([
                        { id: "1", text: "Option A", isCorrect: false },
                        { id: "2", text: "Option B", isCorrect: false },
                        { id: "3", text: "Option C", isCorrect: true },
                      ]),
                      answer: "Option C",
                      explanation: "Please provide an explanation.",
                      marks: 2,
                      difficulty: "medium",
                      topic: req.body.subject
                    };
                  } else if (currentQuestion && line.trim().startsWith("A)") || line.trim().startsWith("a)") || 
                            line.trim().startsWith("A.") || line.trim().startsWith("a.")) {
                    // This looks like an option line, we could parse options here in a more sophisticated version
                  }
                }
                
                if (currentQuestion) {
                  questionsArray.push(currentQuestion);
                }
                
                if (questionsArray.length > 0) {
                  parsedQuestions = questionsArray;
                } else {
                  throw new Error("Could not extract structured question data from response");
                }
              }
            }
          } else {
            // Create mock questions when we can't parse the response at all
            console.log("Creating mock questions as fallback");
            parsedQuestions = [
              {
                text: `What is a fundamental concept in ${req.body.subject}?`,
                type: "multiple-choice",
                options: JSON.stringify([
                  { id: "1", text: "Concept A", isCorrect: true },
                  { id: "2", text: "Concept B", isCorrect: false },
                  { id: "3", text: "Concept C", isCorrect: false },
                ]),
                answer: "Concept A",
                explanation: "This is a generated example question.",
                marks: 2,
                difficulty: "medium",
                topic: req.body.subject
              },
              {
                text: `Define a key term in ${req.body.subject}:`,
                type: "multiple-choice",
                options: JSON.stringify([
                  { id: "1", text: "Definition A", isCorrect: true },
                  { id: "2", text: "Definition B", isCorrect: false },
                  { id: "3", text: "Definition C", isCorrect: false },
                ]),
                answer: "Definition A",
                explanation: "This is a generated example question.",
                marks: 2,
                difficulty: "medium",
                topic: req.body.subject
              }
            ];
          }
        }
        
        // Ensure options are properly formatted as JSON strings if they're objects
        parsedQuestions = parsedQuestions.map((q: any) => ({
          ...q,
          options: q.options ? 
            (typeof q.options === 'string' ? q.options : JSON.stringify(q.options)) 
            : null
        }));
        
        questions = parsedQuestions;
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        // Provide fallback questions rather than failing
        const fallbackQuestions = [
          {
            text: `What is a key principle of ${req.body.subject}?`,
            type: "multiple-choice",
            options: JSON.stringify([
              { id: "1", text: "Principle A", isCorrect: true },
              { id: "2", text: "Principle B", isCorrect: false },
              { id: "3", text: "Principle C", isCorrect: false },
            ]),
            answer: "Principle A",
            explanation: "This is a fallback question generated due to parsing error.",
            marks: 2,
            difficulty: "medium",
            topic: req.body.subject
          }
        ];
        
        questions = fallbackQuestions;
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
            create: questions.map((q: any) => ({
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
    } catch (error: any) {
      console.error("Error processing file:", error);
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting file:", unlinkError);
        }
      }

      // Send a more descriptive error message
      const errorMessage = error.message || "Error processing file";

      res.status(500).json({
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } finally {
      // Always reset processing status, even on error
      resetProcessingStatus();
    }
  },
);

// POST /api/papers/generate-questions
router.post("/generate-questions", async (req, res) => {
  try {
    const { subject, count, existingQuestions } = req.body;

    if (!subject) {
      return res.status(400).json({ error: "Subject is required" });
    }

    let geminiRes;
    try {
      // Call Gemini API to generate questions for a subject
      console.log("Calling Gemini API with subject:", subject);
      console.log("Using API key:", process.env.GEMINI_API_KEY ? "API key exists" : "API key missing");
      
      // Format the API key correctly - removing any quotes if present
      const apiKey = process.env.GEMINI_API_KEY?.replace(/["']/g, '') || '';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      console.log("API URL format:", apiUrl.substring(0, 75) + "...[key hidden]");
      
      geminiRes = await axios.post(
        apiUrl,
        {
          contents: [
            {
              parts: [
                {
                  text: `Generate ${count || 5} exam questions and answers for subject: ${subject}. ${existingQuestions ? `Existing questions: ${JSON.stringify(existingQuestions)}` : ""}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 50000
        }
      );
      
      console.log("Gemini API response received");
    } catch (error) {
      const apiError = error as Error;
      console.log("Gemini API error in generate-questions, using mock questions:", apiError.message);
      console.log("Full error:", JSON.stringify(error, null, 2).substring(0, 500) + "...");
      // Create mock response when API call fails
      geminiRes = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify([
                      {
                        text: `What is the main purpose of ${subject}?`,
                        type: "multiple-choice",
                        options: [
                          { id: "1", text: "Data transmission", isCorrect: true },
                          { id: "2", text: "Data storage", isCorrect: false },
                          { id: "3", text: "Data deletion", isCorrect: false },
                        ],
                        answer: "Data transmission",
                        explanation: "This is a sample explanation for the question.",
                        marks: 2,
                        difficulty: "medium",
                        topic: subject
                      },
                      {
                        text: `What is a key concept in ${subject}?`,
                        type: "multiple-choice",
                        options: [
                          { id: "1", text: "Encryption", isCorrect: true },
                          { id: "2", text: "Compression", isCorrect: false },
                          { id: "3", text: "Pagination", isCorrect: false },
                        ],
                        answer: "Encryption",
                        explanation: "Encryption is essential for secure communications.",
                        marks: 2,
                        difficulty: "medium",
                        topic: subject
                      },
                      {
                        text: `Who is credited with the development of ${subject}?`,
                        type: "multiple-choice",
                        options: [
                          { id: "1", text: "Claude Shannon", isCorrect: true },
                          { id: "2", text: "Alan Turing", isCorrect: false },
                          { id: "3", text: "Tim Berners-Lee", isCorrect: false },
                        ],
                        answer: "Claude Shannon",
                        explanation: "Claude Shannon is often referred to as the father of information theory.",
                        marks: 2,
                        difficulty: "hard",
                        topic: "History"
                      }
                    ])
                  }
                ]
              }
            }
          ]
        }
      };
    }

    // Parse the response
    try {
      const responseText = geminiRes.data.candidates[0].content.parts[0].text;
      let parsedQuestions: any[] = [];
      try {
        // First try to parse as JSON
        parsedQuestions = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("Failed to parse response as JSON, attempting text extraction");
        // If JSON parsing fails, try to extract JSON-like structures from the text
        const potentialJsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (potentialJsonMatch) {
          try {
            parsedQuestions = JSON.parse(potentialJsonMatch[0]);
          } catch (e) {
            // Try to handle the case where Gemini returns markdown-formatted JSON
            if (responseText.includes("```json")) {
              const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
              if (jsonBlockMatch && jsonBlockMatch[1]) {
                try {
                  parsedQuestions = JSON.parse(jsonBlockMatch[1]);
                } catch (markdownError) {
                  console.error("Failed to parse JSON from markdown block:", markdownError);
                }
              }
            }
            
            // If we still don't have valid questions, fall back to a simple format
            if (!parsedQuestions) {
              // Create a structured format from unstructured text
              console.log("Attempting to structure non-JSON response");
              const lines: string[] = responseText.split('\n').filter((line: string) => line.trim());
              
              // Look for questions that might be in a numbered format (1. Question text)
              const questionsArray: any[] = [];
              let currentQuestion: any = null;
              
              for (const line of lines) {
                const questionMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
                if (questionMatch) {
                  if (currentQuestion) {
                    questionsArray.push(currentQuestion);
                  }
                  currentQuestion = {
                    text: questionMatch[2],
                    type: "multiple-choice",
                    options: JSON.stringify([
                      { id: "1", text: "Option A", isCorrect: false },
                      { id: "2", text: "Option B", isCorrect: false },
                      { id: "3", text: "Option C", isCorrect: true },
                    ]),
                    answer: "Option C",
                    explanation: "Please provide an explanation.",
                    marks: 2,
                    difficulty: "medium",
                    topic: req.body.subject
                  };
                } else if (currentQuestion && line.trim().startsWith("A)") || line.trim().startsWith("a)") || 
                          line.trim().startsWith("A.") || line.trim().startsWith("a.")) {
                  // This looks like an option line, we could parse options here in a more sophisticated version
                }
              }
              
              if (currentQuestion) {
                questionsArray.push(currentQuestion);
              }
              
              if (questionsArray.length > 0) {
                parsedQuestions = questionsArray;
              } else {
                throw new Error("Could not extract structured question data from response");
              }
            }
          }
        } else {
          // Create mock questions when we can't parse the response at all
          console.log("Creating mock questions as fallback");
          parsedQuestions = [
            {
              text: `What is a fundamental concept in ${req.body.subject}?`,
              type: "multiple-choice",
              options: JSON.stringify([
                { id: "1", text: "Concept A", isCorrect: true },
                { id: "2", text: "Concept B", isCorrect: false },
                { id: "3", text: "Concept C", isCorrect: false },
              ]),
              answer: "Concept A",
              explanation: "This is a generated example question.",
              marks: 2,
              difficulty: "medium",
              topic: req.body.subject
            },
            {
              text: `Define a key term in ${req.body.subject}:`,
              type: "multiple-choice",
              options: JSON.stringify([
                { id: "1", text: "Definition A", isCorrect: true },
                { id: "2", text: "Definition B", isCorrect: false },
                { id: "3", text: "Definition C", isCorrect: false },
              ]),
              answer: "Definition A",
              explanation: "This is a generated example question.",
              marks: 2,
              difficulty: "medium",
              topic: req.body.subject
            }
          ];
        }
      }
      
      // Ensure options are properly formatted as JSON strings if they're objects
      parsedQuestions = parsedQuestions.map((q: any) => ({
        ...q,
        options: q.options ? 
          (typeof q.options === 'string' ? q.options : JSON.stringify(q.options)) 
          : null
      }));
      
      res.json({ questions: parsedQuestions });
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      // Provide fallback questions rather than failing
      const fallbackQuestions = [
        {
          text: `What is a key principle of ${req.body.subject}?`,
          type: "multiple-choice",
          options: JSON.stringify([
            { id: "1", text: "Principle A", isCorrect: true },
            { id: "2", text: "Principle B", isCorrect: false },
            { id: "3", text: "Principle C", isCorrect: false },
          ]),
          answer: "Principle A",
          explanation: "This is a fallback question generated due to parsing error.",
          marks: 2,
          difficulty: "medium",
          topic: req.body.subject
        }
      ];
      
      res.json({ 
        questions: fallbackQuestions,
        warning: "Failed to parse AI-generated questions, providing fallback content"
      });
    }
  } catch (err) {
    console.error("Error generating questions:", err);
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred." });
    }
  }
});

// GET /api/papers - List all papers, optionally filtered by subjectId
router.get("/", async (req, res) => {
  const { subjectId } = req.query;
  const whereClause: any = {};
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
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(400).json({ error: "An unknown error occurred." });
    }
  }
});

export default router;
