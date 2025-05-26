import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface AnalyticsData {
  totalQuizzes: number;
  averageScore: number;
  totalTimeSpent: number;
  subjectPerformance: Array<{
    subject: string;
    averageScore: number;
    quizzesTaken: number;
    accuracy: number;
  }>;
  recentResults: Array<{
    id: string;
    subject: string;
    score: number;
    totalQuestions: number;
    timeSpent: number;
    completedAt: string;
    date: string;
    time: string;
  }>;
  performanceTrend: Array<{
    date: string;
    score: number;
    quizzes: number;
  }>;
  scoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

export const useAnalytics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics', user?.id],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch all completed quizzes for this user
      const { data: quizzes, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          *,
          subject:subjects(name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (quizError) throw quizError;

      const completedQuizzes = quizzes.map(quiz => ({
        id: quiz.id,
        subject: quiz.subject?.name || 'Unknown Subject',
        score: quiz.score || 0,
        totalQuestions: quiz.total_questions || 0,
        timeSpent: getTimeSpentInSeconds(quiz.started_at, quiz.completed_at),
        completedAt: quiz.completed_at || '',
        date: new Date(quiz.completed_at || '').toLocaleDateString(),
        time: new Date(quiz.completed_at || '').toLocaleTimeString()
      }));

      // Calculate total quizzes
      const totalQuizzes = completedQuizzes.length;

      if (totalQuizzes === 0) {
        return {
          totalQuizzes: 0,
          averageScore: 0,
          totalTimeSpent: 0,
          subjectPerformance: [],
          recentResults: [],
          performanceTrend: [],
          scoreDistribution: []
        };
      }

      // Calculate average score and total time
      const totalScore = completedQuizzes.reduce((sum, quiz) => 
        sum + (quiz.score / quiz.totalQuestions) * 100, 0);
      const averageScore = totalScore / totalQuizzes;
      const totalTimeSpent = completedQuizzes.reduce((sum, quiz) => 
        sum + quiz.timeSpent, 0);

      // Calculate subject performance
      const subjectStats: Record<string, { totalScore: number; count: number; totalQuestions: number }> = {};
      completedQuizzes.forEach(quiz => {
        if (!subjectStats[quiz.subject]) {
          subjectStats[quiz.subject] = { totalScore: 0, count: 0, totalQuestions: 0 };
        }
        subjectStats[quiz.subject].totalScore += quiz.score;
        subjectStats[quiz.subject].count += 1;
        subjectStats[quiz.subject].totalQuestions += quiz.totalQuestions;
      });

      const subjectPerformance = Object.entries(subjectStats).map(([subject, stats]) => ({
        subject,
        averageScore: Math.round((stats.totalScore / stats.totalQuestions) * 10) / 10,
        quizzesTaken: stats.count,
        accuracy: Math.round((stats.totalScore / stats.totalQuestions) * 100)
      }));

      // Get recent results (last 10)
      const recentResults = completedQuizzes.slice(0, 10);

      // Calculate performance trend (last 7 days)
      const last7Days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayResults = completedQuizzes.filter(quiz => 
          quiz.completedAt && quiz.completedAt.startsWith(dateString)
        );
        
        const dayAverage = dayResults.length > 0 
          ? dayResults.reduce((sum, quiz) => sum + (quiz.score / quiz.totalQuestions) * 10, 0) / dayResults.length
          : 0;

        last7Days.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          score: Math.round(dayAverage * 100) / 100,
          quizzes: dayResults.length
        });
      }

      // Calculate score distribution
      const scoreRanges = {
        '0-20%': 0,
        '21-40%': 0,
        '41-60%': 0,
        '61-80%': 0,
        '81-100%': 0
      };

      completedQuizzes.forEach(quiz => {
        const percentage = (quiz.score / quiz.totalQuestions) * 100;
        if (percentage <= 20) scoreRanges['0-20%']++;
        else if (percentage <= 40) scoreRanges['21-40%']++;
        else if (percentage <= 60) scoreRanges['41-60%']++;
        else if (percentage <= 80) scoreRanges['61-80%']++;
        else scoreRanges['81-100%']++;
      });

      const scoreDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
        range,
        count,
        percentage: Math.round((count / totalQuizzes) * 100)
      }));

      return {
        totalQuizzes,
        averageScore: Math.round(averageScore * 100) / 100,
        totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
        subjectPerformance,
        recentResults,
        performanceTrend: last7Days,
        scoreDistribution
      };
    },
    enabled: !!user
  });
};

function getTimeSpentInSeconds(startedAt: string | null, completedAt: string | null): number {
  if (!startedAt || !completedAt) return 0;
  return Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000);
}
