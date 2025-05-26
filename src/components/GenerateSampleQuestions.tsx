import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateSampleQuestions } from "@/integrations/gemini/client";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText } from "lucide-react";
import { useState } from "react";

interface GenerateSampleQuestionsProps {
  subjectId: string;
  documents: any[];
}

const GenerateSampleQuestions = ({ subjectId, documents }: GenerateSampleQuestionsProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const handleGenerateSampleQuestions = async () => {
    try {
      setIsGenerating(true);
      setGeneratedContent(null);

      // Get the content of all completed documents
      const completedDocs = documents.filter(doc => doc.status === 'completed');
      if (completedDocs.length === 0) {
        toast({
          title: "No processed documents",
          description: "Please wait for document processing to complete.",
          variant: "destructive"
        });
        return;
      }

      // Get text content from all documents
      const contents = await Promise.all(
        completedDocs.map(async (doc) => {
          try {
            // Get the document content
            const { data: docData, error: docError } = await supabase
              .from('documents')
              .select('content, file_path')
              .eq('id', doc.id)
              .single();

            if (docError) throw docError;

            // If we have processed content in the database, use that
            if (docData?.content) {
              return docData.content;
            }

            // Otherwise try to download from storage
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('documents')
              .download(docData.file_path);

            if (downloadError) {
              console.error('Error downloading file:', downloadError);
              throw downloadError;
            }

            // Convert blob to text
            return await fileData.text();
          } catch (error) {
            console.error(`Error processing document ${doc.id}:`, error);
            throw error;
          }
        })
      );

      // Filter out any null results and combine contents
      const validContents = contents.filter(Boolean);
      if (validContents.length === 0) {
        throw new Error("Could not retrieve content from any documents");
      }

      const combinedContent = validContents.join('\n\n');

      // Generate sample questions using Gemini
      const result = await generateSampleQuestions(combinedContent);
      setGeneratedContent(result);

      toast({
        title: "Questions Generated",
        description: "Sample questions have been generated successfully.",
      });
    } catch (error: any) {
      console.error("Error generating sample questions:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate sample questions.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedContent) return;

    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_questions.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-purple-100">
      <CardHeader>
        <CardTitle className="text-purple-900">Sample Questions Generator</CardTitle>
        <CardDescription>Generate exam-style questions from your documents</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            onClick={handleGenerateSampleQuestions}
            disabled={isGenerating || documents.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Sample Questions"}
          </Button>

          {generatedContent && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap font-mono text-sm">
                {generatedContent}
              </div>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download as Text File
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GenerateSampleQuestions; 