import AddSubjectModal from "@/components/AddSubjectModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuiz } from "@/hooks/useQuiz";
import { useSubjects } from "@/hooks/useSubjects";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, BookOpen, Clock, FileText, LogOut, Plus, Search, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

const Subjects = () => {
  const { user, signOut } = useAuth();
  const { subjects, isLoading, error, refetch, deleteSubject } = useSubjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { createQuiz } = useQuiz();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      console.error("Error loading subjects:", error);
      toast({
        title: "Error loading subjects",
        description: "Failed to load subjects. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleStartQuiz = async (subject: any) => {
    try {
      // First get all documents for this subject
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('id')
        .eq('subject_id', subject.id);

      if (documentsError) throw documentsError;
      if (!documents || documents.length === 0) {
        toast({
          title: "No documents available",
          description: "Please upload some documents to generate questions first.",
          variant: "destructive"
        });
        return;
      }

      // Get questions from these documents
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('document_id', documents.map(d => d.id))
        .order('created_at', { ascending: false })
        .limit(10);

      if (questionsError) throw questionsError;

      if (!questions || questions.length === 0) {
        toast({
          title: "No questions available",
          description: "Please wait for question generation to complete.",
          variant: "destructive"
        });
        return;
      }

      // Validate question structure
      const validQuestions = questions.filter(q => 
        q.question_text && 
        Array.isArray(q.options) && 
        q.options.length === 4 && 
        q.correct_answer && 
        q.explanation
      );

      if (validQuestions.length === 0) {
        toast({
          title: "Invalid questions",
          description: "The questions for this subject are not properly formatted. Please try regenerating them.",
          variant: "destructive"
        });
        return;
      }

      // Create a new quiz
      const result = await createQuiz.mutateAsync({
        title: `${subject.name} Quiz`,
        subjectId: subject.id,
        questions: validQuestions,
        userId: user.id
      });

      if (!result || !result.id) {
        throw new Error("Failed to create quiz");
      }

      navigate(`/quiz/${result.id}`);
    } catch (error: any) {
      console.error("Error starting quiz:", error);
      toast({
        title: "Error starting quiz",
        description: error.message || "Failed to start quiz. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubject = async (subject: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${subject.name}"? This will also delete all documents and questions.`)) {
      await deleteSubject(subject.id);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Failed to Load Subjects</h2>
          <p className="text-gray-600 mb-6">There was an error loading your subjects.</p>
          <Button
            onClick={() => refetch()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
              <Button 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Subjects</h1>
          <p className="text-xl text-gray-600">Organize and manage your study materials</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="group hover:shadow-xl transition-all duration-300 border-purple-100 hover:border-purple-200 cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 bg-gradient-to-r ${subject.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => handleDeleteSubject(subject, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-purple-900">{subject.name}</CardTitle>
                <CardDescription>{subject.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <FileText className="w-4 h-4 mr-1" />
                      {subject.documents} Documents
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      {subject.quizzes} Quizzes
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-600">{subject.topics} Topics</div>
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {subject.lastActivity}
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      onClick={() => navigate(`/subjects/${subject.id}`)}
                    >
                      Open
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
                      onClick={() => handleStartQuiz(subject)}
                    >
                      Quiz
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No subjects found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or create a new subject</p>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </div>
        )}

        <AddSubjectModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
        />
      </div>
    </div>
  );
};

export default Subjects;
