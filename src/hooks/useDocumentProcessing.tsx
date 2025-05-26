import { useToast } from "@/hooks/use-toast";
import { GeneratedQuestion, generateQuestions } from "@/integrations/gemini/client";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export interface ProcessingResult {
  documentId: string;
  questions: GeneratedQuestion[];
}

export const useDocumentProcessing = () => {
  const { toast } = useToast();
  const [processingStatus, setProcessingStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  const processDocumentMutation = useMutation({
    mutationFn: async ({
      file,
      subjectId,
      name,
      topic,
      userId
    }: {
      file: File;
      subjectId: string;
      name: string;
      topic?: string;
      userId: string;
    }): Promise<ProcessingResult> => {
      try {
        setProcessingStatus("processing");

        // 1. Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 2. Create document record
        const { data: document, error: dbError } = await supabase
          .from('documents')
          .insert([{
            user_id: userId,
            subject_id: subjectId,
            name: name,
            file_path: fileName,
            file_size: file.size,
            file_type: file.type,
            status: 'processing'
          }])
          .select()
          .single();

        if (dbError) throw dbError;

        // 3. Extract text from file and store it
        const text = await file.text();

        // Update document with content
        const { error: contentError } = await supabase
          .from('documents')
          .update({ 
            content: text,
            extracted_text: text 
          })
          .eq('id', document.id);

        if (contentError) throw contentError;

        // 4. Generate questions using Gemini (API key is handled in the client)
        const questions = await generateQuestions(text, 10, name, topic);

        // 5. Store questions in database
        const { error: questionsError } = await supabase
          .from('questions')
          .insert(
            questions.map(q => ({
              document_id: document.id,
              user_id: userId,
              question_text: q.question_text,
              options: q.options,
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              difficulty_level: q.difficulty_level
            }))
          );

        if (questionsError) throw questionsError;

        // 6. Update document status
        const { error: updateError } = await supabase
          .from('documents')
          .update({ status: 'completed' })
          .eq('id', document.id);

        if (updateError) throw updateError;

        setProcessingStatus("success");
        return {
          documentId: document.id,
          questions
        };
      } catch (error: any) {
        setProcessingStatus("error");
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Document processed successfully",
        description: "Questions have been generated and are ready for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    processDocument: processDocumentMutation.mutate,
    isProcessing: processDocumentMutation.isPending,
    processingStatus,
    processingError: processDocumentMutation.error
  };
}; 