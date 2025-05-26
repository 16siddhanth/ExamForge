import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI;

// Initialize with environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Auto-initialize if API key is available
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

export const initializeGemini = (apiKey: string = GEMINI_API_KEY) => {
  if (!apiKey) {
    throw new Error("Gemini API key is required. Please provide it via environment variable VITE_GEMINI_API_KEY or pass it directly.");
  }
  genAI = new GoogleGenerativeAI(apiKey);
};

export interface GeneratedQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty_level: number;
}

export const generateQuestions = async (
  content: string,
  numQuestions: number = 10,
  subject?: string,
  topic?: string
): Promise<GeneratedQuestion[]> => {
  if (!genAI) {
    throw new Error("Gemini API not initialized. Call initializeGemini first.");
  }

  // Use gemini-2.0-flash model
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Generate ${numQuestions} multiple choice questions based on the following content. 
${subject ? `Subject: ${subject}\n` : ''}${topic ? `Topic: ${topic}\n` : ''}
Content: ${content}

For each question, provide:
1. The question text
2. Four options (A, B, C, D)
3. The correct answer
4. A detailed explanation of why the answer is correct
5. A difficulty level (1-5, where 1 is easiest and 5 is hardest)

Format each question as a JSON object with the following structure:
{
  "question_text": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "...",
  "explanation": "...",
  "difficulty_level": number
}

Return an array of these question objects.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract the JSON array from the response
    const jsonStr = text.substring(
      text.indexOf("["),
      text.lastIndexOf("]") + 1
    );
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
};

export const generateSampleQuestions = async (
  content: string
): Promise<string> => {
  if (!genAI) {
    throw new Error("Gemini API not initialized. Call initializeGemini first.");
  }

  // Use gemini-2.0-flash model
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Based on the following past exam paper content, generate a new set of similar exam questions. 
Follow the same style, format, and difficulty level as the original questions.

Content: ${content}

Please generate:
1. A mix of different question types (short answer, long answer, multiple choice) similar to the original
2. Include answers and explanations for each question
3. Maintain the same formatting style as the original content
4. Keep the difficulty level consistent with the original questions

Format the output as a well-structured exam paper with clear sections, question numbers, and marks allocation.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating sample questions:", error);
    throw error;
  }
}; 