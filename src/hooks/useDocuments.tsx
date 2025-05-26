import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  status: 'processing' | 'completed' | 'failed';
  extracted_text?: string;
  subject_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useDocuments = (subjectId?: string) => {
  const { user } = useAuth();

  const {
    data: documents = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['documents', user?.id, subjectId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('documents')
        .select(`
          *,
          subjects!inner(name)
        `)
        .eq('user_id', user.id);

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!user
  });

  return {
    documents,
    isLoading,
    error
  };
};
