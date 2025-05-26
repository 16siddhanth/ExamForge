
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Subject {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
  documents?: number;
  quizzes?: number;
  topics?: number;
  lastActivity?: string;
}

export const useSubjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: subjects = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['subjects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          documents:documents(count),
          quizzes:quizzes(count)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      return data.map(subject => ({
        ...subject,
        documents: subject.documents?.[0]?.count || 0,
        quizzes: subject.quizzes?.[0]?.count || 0,
        topics: Math.floor(Math.random() * 12) + 1, // Placeholder
        lastActivity: new Date(subject.updated_at).toLocaleDateString()
      }));
    },
    enabled: !!user
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (newSubject: Omit<Subject, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('subjects')
        .insert([{
          ...newSubject,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({
        title: "Subject created",
        description: "Your new subject has been added successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating subject",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    subjects,
    isLoading,
    error,
    createSubject: createSubjectMutation.mutate,
    isCreating: createSubjectMutation.isPending
  };
};
