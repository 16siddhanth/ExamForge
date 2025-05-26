import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useDocuments = (subjectId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: documents = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['documents', subjectId],
    queryFn: async () => {
      if (!user || !subjectId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!subjectId
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!user) throw new Error('User not authenticated');

      // First, delete the file from storage
      const document = documents.find(d => d.id === documentId);
      if (document) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([document.file_path]);

        if (storageError) throw storageError;
      }

      // First, delete all questions for this document
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('document_id', documentId);
      if (questionsError) throw questionsError;

      // Then delete the document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({
        title: "Document deleted",
        description: "The document and its questions have been deleted."
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting document",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getDocumentUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // URL valid for 1 hour

      if (error) throw error;
      return data.signedUrl;
    } catch (error: any) {
      toast({
        title: "Error accessing document",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    documents,
    isLoading,
    error,
    deleteDocument: deleteDocumentMutation.mutate,
    isDeleting: deleteDocumentMutation.isPending,
    getDocumentUrl
  };
}; 