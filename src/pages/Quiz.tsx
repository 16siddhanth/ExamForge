import Navbar from "@/components/Navbar";
import QuestionCard from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { ArrowLeft, ArrowRight, Award, BookOpen, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Subject {
  id: string;
  name: string;
  mainTopics: string[];
}

interface QuizQuestion {
  id: string;
  text: string;
  type: "multiple-choice" | "short-answer" | "long-answer";
  options?: Option[];
  answer?: string;
  explanation?: string;
  marks?: number;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizAttempt {
  id: string;
  userId: string;
  title: string;
  score: number;
  date: string;
  questions: {
    questions: QuizQuestion[];
    timeSpent: number;
    subjectId: string;
  };
}

// API functions
async function fetchSubjects() {
  try {
    const response = await axios.get<Subject[]>("http://localhost:4000/api/subjects");
    return response.data;
  } catch (error) {
    console.error("Error fetching subjects:", error);
    throw error;
  }
}

async function fetchQuizHistory(userId: string) {
  try {
    const response = await axios.get<QuizAttempt[]>(`http://localhost:4000/api/quizzes/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching quiz history:", error);
    throw error;
  }
}

async function generateQuiz(subjectId: string, topic?: string) {
  try {
    const response = await axios.post<{ questions: QuizQuestion[] }>("http://localhost:4000/api/quizzes/generate", {
      subjectId,
      topic
    });
    return response.data.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
}

async function saveQuizAttempt(data: {
  userId: string;
  subjectId: string;
  title: string;
  questions: QuizQuestion[];
  score: number;
  timeSpent: number;
}) {
  try {
    const response = await axios.post<QuizAttempt>("http://localhost:4000/api/quizzes", data);
    return response.data;
  } catch (error) {
    console.error("Error saving quiz attempt:", error);
    throw error;
  }
}

export default function Quiz() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("start");
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/");
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [subjectsData, quizHistoryData] = await Promise.all([
          fetchSubjects(),
          fetchQuizHistory(userId)
        ]);
        setSubjects(subjectsData);
        setQuizHistory(quizHistoryData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load quiz data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate, toast]);

  const startQuiz = async () => {
    if (!selectedSubject) {
      toast({
        title: "Error",
        description: "Please select a subject to start the quiz.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const generatedQuestions = await generateQuiz(selectedSubject, selectedTopic);
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setStartTime(Date.now());
      setQuizStarted(true);
      setQuizCompleted(false);
      setActiveTab("quiz");
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to generate quiz questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => 
        q.id === questionId 
          ? { ...q, userAnswer: answer, isCorrect: answer === q.answer }
          : q
      )
    );
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeQuiz = async () => {
    const endTime = Date.now();
    const timeSpentInSeconds = startTime ? Math.floor((endTime - startTime) / 1000) : 0;
    setTimeSpent(timeSpentInSeconds);

    const calculatedScore = questions.reduce((acc, q) => acc + (q.isCorrect ? 1 : 0), 0);
    const scorePercentage = Math.round((calculatedScore / questions.length) * 100);
    setScore(scorePercentage);

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User not found");

      await saveQuizAttempt({
        userId,
        subjectId: selectedSubject,
        title: `${subjects.find(s => s.id === selectedSubject)?.name} Quiz`,
        questions,
        score: scorePercentage,
        timeSpent: timeSpentInSeconds
      });

      setQuizCompleted(true);
      setActiveTab("results");
      
      // Refresh quiz history
      const updatedHistory = await fetchQuizHistory(userId);
      setQuizHistory(updatedHistory);
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast({
        title: "Error",
        description: "Failed to save quiz results. Please try again.",
        variant: "destructive"
      });
    }
  };

  const restartQuiz = () => {
    setSelectedSubject("");
    setSelectedTopic("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setStartTime(null);
    setTimeSpent(0);
    setScore(0);
    setQuizStarted(false);
    setQuizCompleted(false);
    setActiveTab("start");
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  const renderCurrentQuestion = () => {
    const question = questions[currentQuestionIndex];
    if (!question) return null;

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-2">
            {question.topic && (
              <span className="text-sm text-gray-500">Topic: {question.topic}</span>
            )}
            {question.difficulty && (
              <span className="text-sm text-gray-500">Difficulty: {question.difficulty}</span>
            )}
          </div>
        </div>

        <QuestionCard
          question={question}
          onAnswer={handleAnswer}
        />

        <div className="flex justify-between mt-8">
          <Button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={nextQuestion}
            disabled={!question.userAnswer}
          >
            {currentQuestionIndex === questions.length - 1 ? (
              <>
                Complete Quiz
                <CheckCircle className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderQuizResults = () => {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Score
              </CardTitle>
              <CardDescription>{score}%</CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Spent
              </CardTitle>
              <CardDescription>
                {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Questions
              </CardTitle>
              <CardDescription>
                {questions.filter(q => q.isCorrect).length} / {questions.length} correct
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Questions Review</h3>
          {questions.map((question, index) => (
            <div key={question.id} className="border rounded-lg p-4">
              <p className="font-medium mb-2">
                {index + 1}. {question.text}
              </p>
              {question.options?.map(option => (
                <div
                  key={option.id}
                  className={
                    "px-4 py-2 " +
                    (option.isCorrect ? "text-green-600 font-medium" :
                     question.userAnswer === option.id ? "text-red-600" : "")
                  }
                >
                  {option.text}
                  {option.isCorrect && " ✓"}
                  {!option.isCorrect && question.userAnswer === option.id && " ✗"}
                </div>
              ))}
              {question.answer && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Suggested Answer:</p>
                  <p className="text-sm text-gray-700 mt-1">{question.answer}</p>
                </div>
              )}
              {question.explanation && (
                <div className="mt-2 bg-gray-50 p-2 rounded">
                  <p className="text-sm font-medium">Explanation:</p>
                  <p className="text-sm text-gray-700 mt-1">{question.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex justify-center">
          <Button onClick={restartQuiz} className="bg-exam-purple hover:bg-exam-darkPurple">
            Start New Quiz
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isLoggedIn={true} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-gray-600 hover:text-exam-purple mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold mb-2">Practice Quiz</h1>
          <p className="text-gray-600">Test your knowledge with AI-generated questions based on your study materials</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="start" disabled={quizStarted && !quizCompleted}>Quiz Setup</TabsTrigger>
            <TabsTrigger value="quiz" disabled={!quizStarted || quizCompleted}>Active Quiz</TabsTrigger>
            <TabsTrigger value="results" disabled={!quizCompleted}>Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="start">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Setup</CardTitle>
                <CardDescription>
                  {quizHistory.length > 0
                    ? `You've completed ${quizHistory.length} ${quizHistory.length === 1 ? 'quiz' : 'quizzes'} so far.`
                    : "Take your first quiz to test your knowledge!"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Subject</label>
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSubject && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Topic (Optional)</label>
                      <Select
                        value={selectedTopic}
                        onValueChange={setSelectedTopic}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects
                            .find(s => s.id === selectedSubject)
                            ?.mainTopics.map(topic => (
                              <SelectItem key={topic} value={topic}>
                                {topic}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={startQuiz}
                  disabled={!selectedSubject || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    "Start Quiz"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="quiz">
            {renderCurrentQuestion()}
          </TabsContent>
          
          <TabsContent value="results">
            {renderQuizResults()}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
