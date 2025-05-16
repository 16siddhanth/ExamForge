import axios from "axios";

// Interface for the OCR results
export interface OCRResult {
  text: string;
  questions: Question[];
  metadata: {
    pageCount: number;
    documentType: string;
    language: string;
    processingTimeMs: number;
  };
}

export interface Question {
  id: string;
  text: string;
  type: "multiple-choice" | "short-answer" | "long-answer";
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  answer?: string;
  marks?: number;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
}

// Helper function to determine question type
const determineQuestionType = (text: string): "multiple-choice" | "short-answer" | "long-answer" => {
  // Check for common multiple-choice indicators
  if (
    text.includes("(a)") && 
    text.includes("(b)") && 
    text.includes("(c)") || 
    text.includes("Choose one:") || 
    text.includes("Select one:")
  ) {
    return "multiple-choice";
  }
  
  // Check for likely short answer indicators
  if (
    text.length < 300 || 
    text.includes("briefly explain") || 
    text.includes("short answer") || 
    text.includes("in few words")
  ) {
    return "short-answer";
  }
  
  // Default to long answer
  return "long-answer";
};

// Helper function to extract options from multiple choice questions
const extractOptions = (text: string): Array<{id: string, text: string, isCorrect: boolean}> => {
  const options = [];
  
  // Simple option extraction - would be much more sophisticated in real implementation
  const optionIndicators = ["(a)", "(b)", "(c)", "(d)", "(e)"];
  
  for (let i = 0; i < optionIndicators.length; i++) {
    const currentIndicator = optionIndicators[i];
    const nextIndicator = optionIndicators[i + 1];
    
    if (text.includes(currentIndicator)) {
      const startIndex = text.indexOf(currentIndicator) + currentIndicator.length;
      let endIndex = text.length;
      
      if (nextIndicator && text.includes(nextIndicator)) {
        endIndex = text.indexOf(nextIndicator);
      }
      
      const optionText = text.substring(startIndex, endIndex).trim();
      
      if (optionText) {
        options.push({
          id: `option-${i + 1}`,
          text: optionText,
          isCorrect: Math.random() < 0.25 // Randomly set one as correct for demo
        });
      }
    }
  }
  
  // Make sure at least one option is correct
  if (options.length > 0 && !options.some(opt => opt.isCorrect)) {
    const randomIndex = Math.floor(Math.random() * options.length);
    options[randomIndex].isCorrect = true;
  }
  
  return options;
};

// Main function to process documents with OCR
export const processDocumentWithOCR = async (file: File): Promise<OCRResult> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post("/api/papers/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

const extractOptionsFromText = (text: string): { id: string; text: string; isCorrect: boolean; }[] => {
  const options: { id: string; text: string; isCorrect: boolean; }[] = [];
  
  // Look for option patterns like a), b), c) or 1), 2), 3) or A., B., C.
  const optionMatches = text.match(/(?:[a-z]|\d+)\s*[).]\s*[^.;]*/gi);
  
  if (optionMatches) {
    options.push(...optionMatches.map((opt, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      text: opt.replace(/^[a-z0-9][).]\s*/i, '').trim(),
      isCorrect: false // Will be set by backend using NLP
    })));
  }
  
  return options;
};

// Extract questions from OCR text (optional, for local parsing if needed)
export const extractQuestionsFromText = (text: string): Question[] => {
  // This can be left as a stub or call backend if needed
  return [];
};
