
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  subject_id?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  total_questions?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export const useQuizzes = (subjectId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: quizzes = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['quizzes', user?.id, subjectId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', user.id);

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Quiz[];
    },
    enabled: !!user
  });

  const createQuizMutation = useMutation({
    mutationFn: async (newQuiz: Omit<Quiz, 'id' | 'created_at' | 'status'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('quizzes')
        .insert([{
          ...newQuiz,
          user_id: user.id,
          status: 'not_started' as const
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast({
        title: "Quiz created",
        description: "Your new quiz has been created successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating quiz",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    quizzes,
    isLoading,
    error,
    createQuiz: createQuizMutation.mutate,
    isCreating: createQuizMutation.isPending
  };
};
