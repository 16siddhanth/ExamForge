import GenerateSampleQuestions from "@/components/GenerateSampleQuestions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useDocuments } from "@/hooks/useDocuments";
import { useSubjects } from "@/hooks/useSubjects";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Clock, Eye, FileText, LogOut, Trash2, Upload, Users } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

interface Document {
  id: string;
  name: string;
  created_at: string;
  status: string;
  file_path: string;
  file_size: number;
  file_type: string;
}

const SubjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const { subjects, isLoading: isLoadingSubjects } = useSubjects();
  const { documents, isLoading: isLoadingDocuments, deleteDocument, getDocumentUrl } = useDocuments(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const subject = subjects.find(s => s.id === id);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoadingSubjects || isLoadingDocuments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subject details...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Subject Not Found</h2>
          <p className="text-gray-600 mb-6">The subject you're looking for doesn't exist.</p>
          <Button
            onClick={() => navigate('/subjects')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Back to Subjects
          </Button>
        </div>
      </div>
    );
  }

  const handleStartQuiz = async () => {
    try {
      // Get questions for the subject through documents
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('document_id', documents.map(d => d.id))
        .limit(10);

      if (questionsError) throw questionsError;

      if (!questions || questions.length === 0) {
        toast({
          title: "No questions available",
          description: "Please upload some documents to generate questions first.",
          variant: "destructive"
        });
        return;
      }

      // Create a new quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert([{
          title: `${subject.name} Quiz`,
          subject_id: subject.id,
          user_id: user.id,
          total_questions: questions.length,
          status: 'not_started'
        }])
        .select()
        .single();

      if (quizError) throw quizError;

      // Create quiz questions
      const quizQuestions = questions.map(question => ({
        quiz_id: quiz.id,
        question_id: question.id
      }));

      const { error: quizQuestionsError } = await supabase
        .from('quiz_questions')
        .insert(quizQuestions);

      if (quizQuestionsError) throw quizQuestionsError;

      // Navigate to the quiz
      navigate(`/quiz/${quiz.id}`);
    } catch (error: any) {
      console.error("Error starting quiz:", error);
      toast({
        title: "Error starting quiz",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async (doc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${doc.name}"? This will also delete all questions generated from this document.`)) {
      await deleteDocument(doc.id);
    }
  };

  const handleViewDocument = async (doc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = await getDocumentUrl(doc.file_path);
    if (url) {
      // Open in new tab
      window.open(url, '_blank');
    }
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
                  All Subjects
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{subject.name}</h1>
          <p className="text-xl text-gray-600">{subject.description}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-purple-100">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <CardTitle>Documents</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{documents.length}</div>
              <p className="text-gray-600">Total documents</p>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle>Quizzes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{subject.quizzes}</div>
              <p className="text-gray-600">Completed quizzes</p>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <CardTitle>Last Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold text-indigo-900">{subject.lastActivity}</div>
              <p className="text-gray-600">Last updated</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex space-x-4 mb-8">
          <Link to={`/upload?subject=${subject.id}`}>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </Link>
          <Button
            onClick={handleStartQuiz}
            variant="outline"
            className="border-purple-200 text-purple-600 hover:bg-purple-50"
            disabled={documents.length === 0}
          >
            Start Quiz
          </Button>
        </div>

        {/* Documents List */}
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="text-purple-900">Documents</CardTitle>
            <CardDescription>All documents in this subject</CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-900">{doc.name}</h3>
                      <p className="text-sm text-gray-600">
                        Added {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(doc.file_size / 1024 / 1024).toFixed(2)} MB • {doc.file_type}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.status === 'completed' ? 'Completed' : 'Processing'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={(e) => handleViewDocument(doc, e)}
                          disabled={doc.status !== 'completed'}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => handleDeleteDocument(doc, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No documents yet. Start by uploading your first document!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <GenerateSampleQuestions 
            subjectId={subject?.id} 
            documents={documents || []} 
          />
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail; 