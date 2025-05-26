import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { DocumentViewerModal } from '@/components/DocumentViewerModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';
import { useQuestions } from '@/hooks/useQuestions';
import { useSubjects } from '@/hooks/useSubjects';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, BookOpen, Calendar, CheckCircle, ChevronDown, ChevronUp, Download, Eye, FileText, HelpCircle, LogOut, Play, Trash2, Upload, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

// Enhanced Question Component with show/hide functionality
interface QuestionDisplayProps {
  question: any;
  index: number;
}

const QuestionDisplay = ({ question, index }: QuestionDisplayProps) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const isDetailed = question.question_text?.includes('Marks)') || question.type === 'detailed';

  return (
    <div className={`p-4 border rounded-lg bg-white hover:shadow-md transition-shadow ${
      isDetailed ? 'border-purple-200' : 'border-blue-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-4">
          <div className="flex items-center mb-2">
            <h4 className="font-medium text-gray-900">
              {index + 1}. {question.question_text}
            </h4>
            <Badge 
              variant="outline" 
              className={`ml-2 text-xs ${
                isDetailed
                  ? 'border-purple-200 text-purple-600'
                  : 'border-blue-200 text-blue-600'
              }`}
            >
              {isDetailed ? 'Detailed' : 'Quiz Ready'}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAnswer(!showAnswer)}
          className={`flex-shrink-0 hover:bg-opacity-50 ${
            isDetailed 
              ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50' 
              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          {showAnswer ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Hide Answer
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Show Answer
            </>
          )}
        </Button>
      </div>
      
      {/* Different display for detailed vs MCQ questions */}
      {isDetailed ? (
        // For detailed questions, just show the answer text directly
        showAnswer && question.explanation && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h5 className="font-medium text-purple-900 mb-2">Answer:</h5>
            <div className="text-sm text-purple-800 prose max-w-none">{question.explanation}</div>
          </div>
        )
      ) : (
        // For MCQ questions, show options with correct/incorrect indicators
        <>
          <div className="space-y-2 mb-3">
            {Array.isArray(question.options) && question.options.map((option: string, optIndex: number) => (
              <div
                key={optIndex}
                className={`p-3 rounded-lg border text-sm transition-colors ${
                  showAnswer
                    ? option === question.correct_answer
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showAnswer && option === question.correct_answer && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {showAnswer && option !== question.correct_answer && (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {showAnswer && question.explanation && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Explanation:</h5>
              <p className="text-sm text-blue-800">{question.explanation}</p>
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between mt-3">
        <Badge 
          variant="outline" 
          className={
            question.difficulty_level === 1 
              ? 'border-green-200 text-green-700' 
              : question.difficulty_level === 2 
              ? 'border-yellow-200 text-yellow-700' 
              : 'border-red-200 text-red-700'
          }
        >
          {question.difficulty_level === 1 ? 'Easy' : question.difficulty_level === 2 ? 'Medium' : 'Hard'}
        </Badge>
        {showAnswer && !isDetailed && (
          <div className="flex items-center text-xs text-gray-500">
            <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
            Correct: {question.correct_answer}
          </div>
        )}
      </div>
    </div>
  );
};

const SubjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const { subjects } = useSubjects();
  const { questions, isLoading: questionsLoading } = useQuestions(undefined, id);
  const { documents, isLoading: documentsLoading } = useDocuments(id);  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const subject = subjects.find(s => s.id === id);

  if (!subject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Subject not found</h2>
          <Link to="/subjects">
            <Button variant="outline">Back to Subjects</Button>
          </Link>
        </div>
      </div>
    );
  }
  const questionsByDocument = questions.reduce((acc, question) => {
    const docId = question.document_id;
    if (!acc[docId]) {
      acc[docId] = [];
    }
    acc[docId].push(question);
    return acc;
  }, {} as Record<string, typeof questions>);  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setIsDocumentModalOpen(true);
  };
  const handleDownloadDocument = async (document: any) => {
    try {
      if (document.file_path) {
        const { data, error } = await supabase.storage
          .from('documents')
          .download(document.file_path);

        if (error) {
          toast({
            title: "Download failed",
            description: "Could not download the document. Please try again.",
            variant: "destructive",
          });
          return;
        }

        const blob = new Blob([data], { type: document.file_type });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.name;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Download started",
          description: "Your document is being downloaded.",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "An error occurred while downloading the document.",
        variant: "destructive",      });
    }
  };
  const handleDeleteDocument = async (document: any) => {
    setDocumentToDelete(document);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      // Delete the file from storage first
      if (documentToDelete.file_path) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([documentToDelete.file_path]);

        if (storageError) {
          console.warn('Failed to delete file from storage:', storageError.message);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete associated questions first (due to foreign key constraints)
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('document_id', documentToDelete.id);

      if (questionsError) {
        toast({
          title: "Delete failed",
          description: "Could not delete associated questions. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Delete the document record from database
      const { error: docError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentToDelete.id);

      if (docError) {
        toast({
          title: "Delete failed",
          description: "Could not delete the document. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Document deleted",
        description: `"${documentToDelete.name}" and its questions have been deleted successfully.`,
      });

      // Close dialogs
      setIsDeleteDialogOpen(false);
      setIsDocumentModalOpen(false);
      setDocumentToDelete(null);

      // Refresh the page data by reloading
      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "An error occurred while deleting the document.",
        variant: "destructive",
      });
    }
  };

  const getDocumentName = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    return doc ? doc.name : 'Unknown Document';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ExamForge
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  Dashboard
                </Button>
              </Link>
              <Link to="/subjects">
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  Subjects
                </Button>
              </Link>
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/subjects" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subjects
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{subject.name}</h1>
              <p className="text-xl text-gray-600">{subject.description}</p>
            </div>
            <div className={`w-16 h-16 bg-gradient-to-r ${subject.color} rounded-xl flex items-center justify-center`}>
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-2xl font-bold">{subject.documents}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Generated Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <HelpCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-2xl font-bold">{questions.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Quizzes Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Play className="w-5 h-5 text-purple-500 mr-2" />
                <span className="text-2xl font-bold">{subject.quizzes}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-8">
          <Link to="/upload" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Documents
            </Button>
          </Link>
          <Link to={`/quiz?subject=${subject.id}`} className="flex-1">
            <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50">
              <Play className="w-4 h-4 mr-2" />
              Take Quiz
            </Button>
          </Link>        </div>

        {/* Uploaded Documents */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Uploaded Documents</h2>
          {documentsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading documents...</p>
            </div>
          ) : documents.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {documents.map((document) => (
                <Card key={document.id} className="border-purple-100 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{document.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {(document.file_size / 1024 / 1024).toFixed(2)} MB • {document.file_type}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant={document.status === 'completed' ? 'default' : document.status === 'processing' ? 'secondary' : 'destructive'}
                        className={
                          document.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : document.status === 'processing' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {document.status === 'completed' ? 'Processed' : document.status === 'processing' ? 'Processing' : 'Failed'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Uploaded {new Date(document.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {document.extracted_text && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Extracted Content Preview:</p>
                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 max-h-20 overflow-hidden">
                          {document.extracted_text.substring(0, 150)}...
                        </div>
                      </div>
                    )}                    <div className="space-y-2">
                      <div className="flex space-x-2">                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1" 
                          disabled={!document.file_path}
                          onClick={() => handleViewDocument(document)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Content
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleDownloadDocument(document)}
                          disabled={!document.file_path}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleDeleteDocument(document)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-purple-100">
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No documents uploaded yet</h3>
                <p className="text-gray-500 mb-6">
                  Upload documents to start generating practice questions
                </p>
                <Link to="/upload">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Generated Questions by Document */}
        {questionsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        ) : Object.keys(questionsByDocument).length > 0 ? (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Generated Questions</h2>            <div className="space-y-6">
              {Object.entries(questionsByDocument).map(([documentId, docQuestions]) => (
                <Card key={documentId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <span>Questions from "{getDocumentName(documentId)}"</span>
                      </div>
                      <Badge variant="secondary">{docQuestions.length} questions</Badge>
                    </CardTitle>
                    <CardDescription>
                      AI-generated questions from your uploaded document
                    </CardDescription>
                  </CardHeader>                  <CardContent>
                    <div className="space-y-4">
                      {/* Separate detailed and MCQ questions */}
                      {(() => {
                        const detailedQuestions = docQuestions.filter(q => q.question_text?.includes('Marks)') || q.type === 'detailed');
                        const mcqQuestions = docQuestions.filter(q => 
                          !q.question_text?.includes('Marks)') && 
                          q.type !== 'detailed' && 
                          (!('type' in q) || q?.type !== 'detailed')
                        );
                        
                        return (
                          <>
                            {/* Show Detailed Questions */}
                            {detailedQuestions.length > 0 && (
                              <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-purple-900 flex items-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Detailed Questions ({detailedQuestions.length})
                                  </h4>
                                  <Badge variant="outline" className="border-purple-200 text-purple-600">
                                    Study & Review
                                  </Badge>
                                </div>
                                <div className="space-y-3">
                                  {detailedQuestions.map((question, index) => (
                                    <QuestionDisplay key={question.id} question={question} index={index} />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Show MCQ Questions */}
                            {mcqQuestions.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-blue-900 flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Multiple Choice Questions ({mcqQuestions.length})
                                  </h4>
                                  <Badge variant="outline" className="border-blue-200 text-blue-600">
                                    Quiz Ready
                                  </Badge>
                                </div>
                                <div className="space-y-3">
                                  {mcqQuestions.map((question, index) => (
                                    <QuestionDisplay key={question.id} question={question} index={index} />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Show all questions if no type distinction available */}
                            {detailedQuestions.length === 0 && mcqQuestions.length === 0 && docQuestions.length > 0 && (
                              <div className="space-y-3">
                                {docQuestions.map((question, index) => (
                                  <QuestionDisplay key={question.id} question={question} index={index} />
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No questions generated yet</h3>
              <p className="text-gray-500 mb-6">
                Upload some documents to automatically generate practice questions
              </p>
              <Link to="/upload">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
              </Link>
            </CardContent>          </Card>
        )}
      </div>

      {/* Document Viewer Modal */}      <DocumentViewerModal
        document={selectedDocument}
        isOpen={isDocumentModalOpen}        onClose={() => setIsDocumentModalOpen(false)}
        onDelete={handleDeleteDocument}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteDocument}
        documentName={documentToDelete?.name || ''}
        questionsCount={questionsByDocument[documentToDelete?.id]?.length || 0}
      />
    </div>
  );
};

export default SubjectDetail;
