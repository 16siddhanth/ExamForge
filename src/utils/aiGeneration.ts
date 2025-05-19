import axios from "axios";
import { Question } from "./ocr";

export const generateQuestionsFromAI = async (
  existingQuestions: Question[],
  subjectName: string,
  count: number = 5
): Promise<Question[]> => {
  try {
    // Call backend API to generate questions using Gemini
    console.log(`Generating ${count} questions for ${subjectName}`);
    
    // Sanitize subject name to prevent issues
    const sanitizedSubject = subjectName.trim();
    if (!sanitizedSubject) {
      throw new Error("Subject name is required");
    }
    
    // Prepare the existing questions - only send essential data
    const sanitizedExistingQuestions = existingQuestions.map(q => ({
      text: q.text,
      type: q.type,
      answer: q.answer,
      topic: q.topic || subjectName
    }));
    
    console.log("Making API request to generate questions");
    const response = await axios.post("/api/papers/generate-questions", {
      subject: sanitizedSubject,
      count: Math.min(count, 20), // Limit count to prevent overly large requests
      existingQuestions: sanitizedExistingQuestions.slice(0, 10), // Limit to 10 questions to avoid request size issues
    });
    
    console.log("API response received:", response.status);
    
    // Make sure options are in correct format
    if (response.data && response.data.questions && Array.isArray(response.data.questions)) {
      console.log(`Successfully generated ${response.data.questions.length} questions`);
      
      return response.data.questions.map((q: any) => {
        // Generate a random ID if none exists
        const id = q.id || `q-${Math.random().toString(36).substring(2, 11)}`;
        
        // Ensure options are properly formatted
        let parsedOptions = [];
        if (q.options) {
          if (typeof q.options === 'string') {
            try {
              parsedOptions = JSON.parse(q.options);
            } catch (e) {
              console.error('Error parsing options string:', e);
              // Create default options as fallback
              parsedOptions = [
                { id: "1", text: "Option A", isCorrect: true },
                { id: "2", text: "Option B", isCorrect: false },
                { id: "3", text: "Option C", isCorrect: false },
              ];
            }
          } else if (Array.isArray(q.options)) {
            parsedOptions = q.options;
          }
        }
        
        // Ensure all required fields have valid values
        return {
          id,
          text: q.text || `Question about ${subjectName}`,
          type: q.type || "multiple-choice",
          options: parsedOptions,
          answer: q.answer || "",
          explanation: q.explanation || "",
          marks: q.marks || 2,
          difficulty: q.difficulty || "medium",
          topic: q.topic || subjectName
        };
      });
    }
    
    console.warn("Unexpected response format:", response.data);
    throw new Error("Unexpected response format from question generation API");
  } catch (error: any) {
    console.error("Error generating questions from AI:", error);
    if (error.response) {
      console.error("API response error:", error.response.status, error.response.data);
    }
    
    // Return a few generic fallback questions if API call fails
    return [
      {
        id: `q-${Math.random().toString(36).substring(2, 11)}`,
        text: `What is the main purpose of ${subjectName}?`,
        type: "multiple-choice",
        options: [
          { id: "1", text: "To solve practical problems", isCorrect: true },
          { id: "2", text: "To create theoretical models", isCorrect: false },
          { id: "3", text: "To document historical information", isCorrect: false },
        ],
        answer: "To solve practical problems",
        explanation: "This is a fallback question generated when the API call failed.",
        marks: 2,
        difficulty: "medium",
        topic: subjectName
      },
      {
        id: `q-${Math.random().toString(36).substring(2, 11)}`,
        text: `What is a key concept in ${subjectName}?`,
        type: "short-answer",
        answer: "Students should identify a fundamental concept in the subject.",
        explanation: "This is a fallback question generated when the API call failed.",
        marks: 3,
        difficulty: "medium", 
        topic: subjectName
      }
    ];
  }
};

export const generateSamplePaper = async (
  existingQuestions: Question[],
  subjectName: string,
  paperTitle: string = "Sample Examination Paper"
): Promise<{
  title: string;
  description: string;
  questions: Question[];
  totalMarks: number;
  estimatedTime: number;
  createdAt: string;
}> => {
  // Use backend for real sample paper generation
  const questions = await generateQuestionsFromAI(existingQuestions, subjectName, 10);
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const estimatedTime = Math.round(totalMarks * 1.5);
  return {
    title: paperTitle,
    description: `This sample paper was generated by Gemini AI based on previous ${subjectName} exams.`,
    questions,
    totalMarks,
    estimatedTime,
    createdAt: new Date().toISOString(),
  };
};
