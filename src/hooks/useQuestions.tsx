
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  difficulty_level: number;
  document_id: string;
  created_at: string;
}

export const useQuestions = (documentId?: string, subjectId?: string) => {
  const { user } = useAuth();

  const {
    data: questions = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['questions', user?.id, documentId, subjectId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('questions')
        .select(`
          *,
          documents!inner(
            id,
            name,
            subject_id
          )
        `)
        .eq('user_id', user.id);

      if (documentId) {
        query = query.eq('document_id', documentId);
      }

      if (subjectId) {
        query = query.eq('documents.subject_id', subjectId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Question[];
    },
    enabled: !!user
  });

  return {
    questions,
    isLoading,
    error
  };
};
