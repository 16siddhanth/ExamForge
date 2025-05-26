import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty_level: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  subject_id?: string;
  total_questions: number;
  score?: number;
  status: "not_started" | "in_progress" | "completed";
  started_at?: string;
  completed_at?: string;
  questions: Question[];
}

interface CreateQuizParams {
  title: string;
  subjectId: string;
  questions: Question[];
  userId: string;
}

export const useQuiz = (quizId?: string) => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  // Fetch quiz details if quizId is provided
  const {
    data: quiz,
    isLoading: isLoadingQuiz,
    error: quizError
  } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      if (!quizId) return null;

      try {
        // First fetch the quiz details
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (quizError) throw quizError;
        if (!quizData) throw new Error("Quiz not found");

        // Then fetch the questions separately
        const { data: quizQuestionsData, error: questionsError } = await supabase
          .from("quiz_questions")
          .select(`
            *,
            questions:question_id (
              id,
              question_text,
              options,
              correct_answer,
              explanation,
              difficulty_level
            )
          `)
          .eq("quiz_id", quizId);

        if (questionsError) throw questionsError;
        if (!quizQuestionsData || !Array.isArray(quizQuestionsData)) {
          throw new Error("Failed to load quiz questions");
        }

        // Extract and validate questions
        const questions = quizQuestionsData
          .map(qq => qq.questions)
          .filter(q => q && q.question_text && Array.isArray(q.options));

        if (questions.length === 0) {
          throw new Error("No valid questions found for this quiz");
        }

        // Get existing user answers
        const userAnswersData = quizQuestionsData.reduce((acc, qq) => {
          if (qq.user_answer) {
            acc[qq.question_id] = qq.user_answer;
          }
          return acc;
        }, {} as Record<string, string>);

        // Set initial user answers if any exist
        if (Object.keys(userAnswersData).length > 0) {
          setUserAnswers(userAnswersData);
        }

        return {
          ...quizData,
          questions
        };
      } catch (error: any) {
        console.error("Error loading quiz:", error);
        toast({
          title: "Error loading quiz",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
    },
    enabled: !!quizId,
    retry: 3,
    retryDelay: 1000
  });

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: async ({ title, subjectId, questions, userId }: CreateQuizParams) => {
      try {
        // Create quiz record
        const { data: quiz, error: quizError } = await supabase
          .from("quizzes")
          .insert([{
            title,
            subject_id: subjectId,
            user_id: userId,
            total_questions: questions.length,
            status: "in_progress",
            started_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (quizError) throw quizError;
        if (!quiz) throw new Error("Failed to create quiz");

        // Create quiz questions
        const { error: questionsError } = await supabase
          .from("quiz_questions")
          .insert(
            questions.map(question => ({
              quiz_id: quiz.id,
              question_id: question.id
            }))
          );

        if (questionsError) throw questionsError;

        return quiz;
      } catch (error: any) {
        console.error("Error creating quiz:", error);
        toast({
          title: "Error creating quiz",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    }
  });

  // Submit an answer
  const submitAnswerMutation = useMutation({
    mutationFn: async ({
      quizId,
      questionId,
      answer
    }: {
      quizId: string;
      questionId: string;
      answer: string;
    }) => {
      const { error } = await supabase
        .from("quiz_questions")
        .update({
          user_answer: answer,
          answered_at: new Date().toISOString(),
          is_correct: answer === quiz?.questions[currentQuestionIndex].correct_answer
        })
        .eq("quiz_id", quizId)
        .eq("question_id", questionId);

      if (error) throw error;

      setUserAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
    }
  });

  // Complete quiz
  const completeQuizMutation = useMutation({
    mutationFn: async (quizId: string) => {
      const correctAnswers = Object.entries(userAnswers).filter(
        ([questionId, answer]) => {
          const question = quiz?.questions.find(q => q.id === questionId);
          return question?.correct_answer === answer;
        }
      ).length;

      const score = Math.round((correctAnswers / (quiz?.total_questions || 1)) * 100);

      const { error } = await supabase
        .from("quizzes")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          score
        })
        .eq("id", quizId);

      if (error) throw error;

      // Invalidate the subjects query to update the quizzes count
      queryClient.invalidateQueries({ queryKey: ['subjects'] });

      return score;
    },
    onSuccess: (score) => {
      toast({
        title: "Quiz completed!",
        description: `Your score: ${score}%`,
      });
    }
  });

  return {
    quiz,
    isLoadingQuiz,
    quizError,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    userAnswers,
    createQuiz: createQuizMutation,
    isCreating: createQuizMutation.isPending,
    submitAnswer: submitAnswerMutation.mutate,
    isSubmitting: submitAnswerMutation.isPending,
    completeQuiz: completeQuizMutation.mutate,
    isCompleting: completeQuizMutation.isPending
  };
}; 