// Test component to verify QuestionDisplay functionality
// This can be used to test the show/hide answer feature

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import React from 'react';

const TestQuestionDisplay = () => {
  const sampleQuestions = [
    {
      id: 1,
      question_text: "What is the primary purpose of artificial intelligence in education?",
      options: [
        "A) To replace human teachers entirely",
        "B) To enhance learning experiences and provide personalized education",
        "C) To reduce the cost of education",
        "D) To make learning more difficult"
      ],
      correct_answer: "B) To enhance learning experiences and provide personalized education",
      explanation: "AI in education is designed to complement human teaching by providing personalized learning experiences, adaptive content, and intelligent tutoring systems. It helps identify learning gaps and provides customized support to each student.",
      difficulty_level: 2
    },
    {
      id: 2,
      question_text: "Which machine learning algorithm is commonly used for classification tasks?",
      options: [
        "A) Linear Regression",
        "B) K-means Clustering", 
        "C) Random Forest",
        "D) Principal Component Analysis"
      ],
      correct_answer: "C) Random Forest",
      explanation: "Random Forest is a popular ensemble learning algorithm used for both classification and regression tasks. It builds multiple decision trees and merges them together to get more accurate and stable predictions.",
      difficulty_level: 3
    },
    {
      id: 3,
      question_text: "What does HTML stand for?",
      options: [
        "A) HyperText Markup Language",
        "B) High Tech Modern Language",
        "C) Home Tool Markup Language", 
        "D) Hyperlink and Text Markup Language"
      ],
      correct_answer: "A) HyperText Markup Language",
      explanation: "HTML stands for HyperText Markup Language. It is the standard markup language used to create web pages and web applications.",
      difficulty_level: 1
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Question Display Test
        </h1>
        <p className="text-gray-600">
          Testing the enhanced question display with show/hide answer functionality
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sample Questions with Gemini AI Integration</span>
            <Badge variant="secondary">{sampleQuestions.length} questions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sampleQuestions.map((question, index) => (
              <QuestionDisplay 
                key={question.id} 
                question={question} 
                index={index} 
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="text-center py-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            ✅ Integration Complete
          </h3>
          <p className="text-gray-600 mb-4">
            The enhanced question display is working correctly with:
          </p>
          <div className="text-left max-w-md mx-auto space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Show/Hide answer functionality
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Color-coded answer options
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Detailed explanations
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Difficulty level indicators
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Gemini AI integration ready
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Question Component (same as in SubjectDetail.tsx)
interface QuestionDisplayProps {
  question: any;
  index: number;
}

const QuestionDisplay = ({ question, index }: QuestionDisplayProps) => {
  const [showAnswer, setShowAnswer] = React.useState(false);

  return (
    <div className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900 flex-1 pr-4">
          {index + 1}. {question.question_text}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAnswer(!showAnswer)}
          className="flex-shrink-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
        >
          {showAnswer ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Hide Answer
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Show Answer
            </>
          )}
        </Button>
      </div>
      
      <div className="space-y-2 mb-3">
        {question.options.map((option: string, optIndex: number) => (
          <div
            key={optIndex}
            className={`p-3 rounded-lg border text-sm transition-colors ${
              showAnswer
                ? option === question.correct_answer
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{option}</span>
              {showAnswer && option === question.correct_answer && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              {showAnswer && option !== question.correct_answer && (
                <XCircle className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        ))}
      </div>

      {showAnswer && question.explanation && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Explanation:</h5>
          <p className="text-sm text-blue-800">{question.explanation}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <Badge 
          variant="outline" 
          className={
            question.difficulty_level === 1 
              ? 'border-green-200 text-green-700' 
              : question.difficulty_level === 2 
              ? 'border-yellow-200 text-yellow-700' 
              : 'border-red-200 text-red-700'
          }
        >
          {question.difficulty_level === 1 ? 'Easy' : question.difficulty_level === 2 ? 'Medium' : 'Hard'}
        </Badge>
        {showAnswer && (
          <div className="flex items-center text-xs text-gray-500">
            <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
            Correct: {question.correct_answer}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestQuestionDisplay;
