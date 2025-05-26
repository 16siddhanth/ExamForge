import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

const Quiz = () => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  const subjects = [
    'Mathematics',
    'Physics', 
    'Chemistry',
    'Biology',
    'Computer Science',
    'History',
    'Geography',
    'English',
    'Economics',
    'Psychology'
  ];

  const generateQuestions = async (subject: string) => {
    setLoading(true);
    try {
      // Simulate API call with mock data
      const mockQuestions: Question[] = [
        {
          question: `What is the capital of France in ${subject} context?`,
          options: ['Paris', 'London', 'Berlin', 'Madrid'],
          correctAnswer: 'Paris'
        },
        {
          question: `Which element has the chemical symbol 'H' in ${subject}?`,
          options: ['Helium', 'Hydrogen', 'Hafnium', 'Holmium'],
          correctAnswer: 'Hydrogen'
        },
        {
          question: `What is 2 + 2 in ${subject} mathematics?`,
          options: ['3', '4', '5', '6'],
          correctAnswer: '4'
        },
        {
          question: `Who wrote Romeo and Juliet in ${subject} literature?`,
          options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
          correctAnswer: 'William Shakespeare'
        },
        {
          question: `What is the largest planet in our solar system according to ${subject}?`,
          options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
          correctAnswer: 'Jupiter'
        },
        {
          question: `Which programming language is known for ${subject} development?`,
          options: ['Python', 'Java', 'C++', 'JavaScript'],
          correctAnswer: 'Python'
        },
        {
          question: `What is the powerhouse of the cell in ${subject} biology?`,
          options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Chloroplast'],
          correctAnswer: 'Mitochondria'
        },
        {
          question: `When did World War II end according to ${subject} history?`,
          options: ['1944', '1945', '1946', '1947'],
          correctAnswer: '1945'
        },
        {
          question: `What is the chemical formula for water in ${subject} chemistry?`,
          options: ['H2O', 'CO2', 'NaCl', 'CH4'],
          correctAnswer: 'H2O'
        },
        {
          question: `Which continent is the smallest by ${subject} geography?`,
          options: ['Europe', 'Antarctica', 'Australia', 'South America'],
          correctAnswer: 'Australia'
        }
      ];
      
      setQuestions(mockQuestions);
      setUserAnswers(new Array(mockQuestions.length).fill(''));
      setCurrentQuestionIndex(0);
      setQuizCompleted(false);
      setScore(0);
      setStartTime(Date.now());
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleQuizComplete();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  const handleQuizComplete = async () => {
    const endTime = Date.now();
    const timeSpent = Math.round((endTime - startTime) / 1000); // Time in seconds
    const user = (await supabase.auth.getUser()).data.user;

    if (!user) return;
    
    // Calculate score
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    try {
      // Save quiz result to Supabase
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: `${selectedSubject} Quiz`,
          subject_id: subjectId,
          user_id: user.id,
          status: 'completed',
          score: correctAnswers,
          total_questions: questions.length,
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date(endTime).toISOString()
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Save quiz questions and answers
      const quizQuestions = questions.map((q, index) => ({
        quiz_id: quiz.id,
        question_id: q.id,
        user_answer: userAnswers[index] || null,
        is_correct: userAnswers[index] === q.correctAnswer,
        answered_at: new Date().toISOString()
      }));

      const { error: answersError } = await supabase
        .from('quiz_questions')
        .insert(quizQuestions);

      if (answersError) throw answersError;

      // Show success toast
      toast({
        title: "Quiz completed!",
        description: `Your score: ${correctAnswers}/${questions.length}`,
      });
    } catch (error) {
      console.error('Error saving quiz result:', error);
      toast({
        title: "Error saving quiz result",
        description: "Your score couldn't be saved. Please try again.",
        variant: "destructive"
      });
    }

    setScore(correctAnswers);
    setQuizCompleted(true);
  };

  const resetQuiz = () => {
    setSelectedSubject('');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setScore(0);
    setStartTime(0);
  };

  if (!selectedSubject) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Select a Subject</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <Card key={subject} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-center">{subject}</h3>
                <Button 
                  className="w-full mt-4"
                  onClick={() => {
                    setSelectedSubject(subject);
                    generateQuestions(subject);
                  }}
                >
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Generating questions for {selectedSubject}...</p>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Quiz Completed!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl font-bold text-blue-500 mb-4">
              {score}/{questions.length}
            </div>
            <p className="text-xl mb-2">
              You scored {Math.round((score / questions.length) * 100)}%
            </p>
            <p className="text-gray-600 mb-6">
              Subject: {selectedSubject}
            </p>
            
            {/* Show detailed results */}
            <div className="mt-6 text-left max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-4">Detailed Results:</h3>
              {questions.map((question, index) => (
                <div key={index} className="mb-4 p-4 border rounded-lg">
                  <p className="font-medium mb-2">{question.question}</p>
                  <div className="text-sm">
                    <p className={`${userAnswers[index] === question.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                      Your answer: {userAnswers[index] || 'Not answered'}
                    </p>
                    {userAnswers[index] !== question.correctAnswer && (
                      <p className="text-green-600">
                        Correct answer: {question.correctAnswer}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={resetQuiz}>
                Take Another Quiz
              </Button>
              <Button variant="outline" onClick={() => setSelectedSubject('')}>
                Change Subject
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{selectedSubject} Quiz</h1>
          <Button variant="outline" onClick={resetQuiz}>
            Exit Quiz
          </Button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`w-full p-3 text-left border rounded-lg transition-colors ${
                  userAnswers[currentQuestionIndex] === option
                    ? 'bg-blue-100 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleAnswerSelect(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button 
              onClick={handleNextQuestion}
              disabled={!userAnswers[currentQuestionIndex]}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Quiz;