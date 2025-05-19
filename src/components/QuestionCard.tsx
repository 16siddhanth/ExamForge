import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  text: string;
  type: "multiple-choice" | "short-answer" | "long-answer";
  options?: Option[] | string;
  answer?: string;
  explanation?: string;
  marks?: number;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

interface QuestionCardProps {
  question: QuizQuestion;
  onAnswer: (questionId: string, answer: string) => void;
}

const QuestionCard = ({ question, onAnswer }: QuestionCardProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(question.userAnswer || null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(!!question.userAnswer);
  const [parsedOptions, setParsedOptions] = useState<Option[]>([]);

  // Parse options if they're stored as a string
  useEffect(() => {
    if (question.options) {
      if (typeof question.options === 'string') {
        try {
          setParsedOptions(JSON.parse(question.options));
        } catch (e) {
          console.error('Error parsing options:', e);
          setParsedOptions([]);
        }
      } else if (Array.isArray(question.options)) {
        setParsedOptions(question.options);
      }
    } else {
      setParsedOptions([]);
    }
  }, [question.options]);

  const handleOptionSelect = (optionId: string) => {
    if (isSubmitted) return;
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOption || isSubmitted) return;
    setIsSubmitted(true);
    onAnswer(question.id, selectedOption);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{question.text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.type === "multiple-choice" && parsedOptions.length > 0 && (
          <div className="space-y-2">
            {parsedOptions.map((option) => (
              <Button
                key={option.id}
                variant={selectedOption === option.id ? "default" : "outline"}
                className={`w-full justify-start text-left ${
                  isSubmitted
                    ? option.isCorrect
                      ? "bg-green-100 hover:bg-green-100"
                      : selectedOption === option.id
                      ? "bg-red-100 hover:bg-red-100"
                      : ""
                    : ""
                }`}
                onClick={() => handleOptionSelect(option.id)}
                disabled={isSubmitted}
              >
                <div className="flex items-center gap-2">
                  {isSubmitted && option.isCorrect && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  {isSubmitted && !option.isCorrect && selectedOption === option.id && (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span>{option.text}</span>
                </div>
              </Button>
            ))}
          </div>
        )}

        {(question.type === "short-answer" || question.type === "long-answer") && (
          <textarea
            className="w-full min-h-[100px] p-2 border rounded-md"
            placeholder="Type your answer here..."
            value={selectedOption || ""}
            onChange={(e) => handleOptionSelect(e.target.value)}
            disabled={isSubmitted}
          />
        )}

        {isSubmitted && question.explanation && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="font-medium mb-2">Explanation:</p>
            <p className="text-gray-700">{question.explanation}</p>
          </div>
        )}
      </CardContent>
      {!isSubmitted && selectedOption && (
        <div className="px-6 pb-6">
          <Button
            className="w-full"
            onClick={handleSubmit}
          >
            Submit Answer
          </Button>
        </div>
      )}
    </Card>
  );
}

export default QuestionCard;
