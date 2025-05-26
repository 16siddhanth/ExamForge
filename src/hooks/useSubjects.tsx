import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
    error,
    refetch
  } = useQuery({
    queryKey: ['subjects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        // First get subjects with document counts
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select(`
            *,
            documents:documents(count)
          `)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (subjectsError) throw subjectsError;
        if (!subjectsData) return [];

        // Then get completed quizzes count for each subject
        const subjectsWithQuizzes = await Promise.all(
          subjectsData.map(async (subject) => {
            const { count, error: quizzesError } = await supabase
              .from('quizzes')
              .select('*', { count: 'exact', head: true })
              .eq('subject_id', subject.id)
              .eq('status', 'completed');

            if (quizzesError) {
              console.error('Error fetching quizzes count:', quizzesError);
              return {
                ...subject,
                documents: subject.documents?.[0]?.count || 0,
                quizzes: 0,
                topics: Math.floor(Math.random() * 12) + 1, // Placeholder
                lastActivity: new Date(subject.updated_at).toLocaleDateString()
              };
            }

            return {
              ...subject,
              documents: subject.documents?.[0]?.count || 0,
              quizzes: count || 0,
              topics: Math.floor(Math.random() * 12) + 1, // Placeholder
              lastActivity: new Date(subject.updated_at).toLocaleDateString()
            };
          })
        );

        return subjectsWithQuizzes;
      } catch (error: any) {
        console.error('Error fetching subjects:', error);
        toast({
          title: "Error loading subjects",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
    },
    enabled: !!user,
    retry: 3,
    retryDelay: 1000
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

  const deleteSubjectMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({
        title: "Subject deleted",
        description: "The subject and all its contents have been deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting subject",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    subjects,
    isLoading,
    error,
    refetch,
    createSubject: createSubjectMutation.mutate,
    isCreating: createSubjectMutation.isPending,
    deleteSubject: deleteSubjectMutation.mutate,
    isDeleting: deleteSubjectMutation.isPending
  };
};
