
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessingResult {
  success: boolean;
  questionsGenerated?: number;
  extractedText?: string;
  error?: string;
}

export const useDocumentProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processDocument = async (documentId: string): Promise<ProcessingResult> => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: { documentId }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Document processed successfully",
          description: `Generated ${data.questionsGenerated} questions from your document.`
        });
      }

      return data;
    } catch (error: any) {
      const errorResult = { success: false, error: error.message };
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive"
      });
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processDocument,
    isProcessing
  };
};
