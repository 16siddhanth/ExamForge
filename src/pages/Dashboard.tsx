import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useSubjects } from "@/hooks/useSubjects";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { BarChart3, BookOpen, Clock, FileText, LogOut, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { subjects, isLoading: subjectsLoading } = useSubjects();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizzesError, setQuizzesError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchQuizzes = async () => {
      try {
        setQuizzesLoading(true);
        const { data: quizResults, error } = await supabase
          .from('quizzes')
          .select(`
            *,
            subject:subjects(name)
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setQuizzes(quizResults || []);
      } catch (err) {
        console.error('Error fetching quizzes:', err);
        setQuizzesError(err instanceof Error ? err.message : 'Failed to load quiz results');
      } finally {
        setQuizzesLoading(false);
      }
    };

    fetchQuizzes();
  }, [user]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (subjectsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const recentSubjects = subjects.slice(0, 3);

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
              <Link to="/subjects">
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Subjects
                </Button>
              </Link>
              <Link to="/upload">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {user.email}!</h1>
          <p className="text-xl text-gray-600">Ready to continue your learning journey?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Link to="/upload">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-purple-100 hover:border-purple-200">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-900">Upload Document</CardTitle>
                <CardDescription>Add new study materials</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/subjects">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-purple-100 hover:border-purple-200">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-900">Browse Subjects</CardTitle>
                <CardDescription>Explore your subjects</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/quiz">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-purple-100 hover:border-purple-200">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-900">Take Quiz</CardTitle>
                <CardDescription>Test your knowledge</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/analytics">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-purple-100 hover:border-purple-200">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-900">View Analytics</CardTitle>
                <CardDescription>Track your progress</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Subjects */}
          <Card className="border-purple-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-purple-900">Recent Subjects</CardTitle>
                <Link to="/subjects">
                  <Button variant="outline" size="sm" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSubjects.length > 0 ? recentSubjects.map((subject) => (
                  <div key={subject.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-purple-900">{subject.name}</h3>
                      <p className="text-sm text-gray-600">
                        {subject.documents} documents • {subject.quizzes} quizzes
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {subject.lastActivity}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No subjects yet. Start by creating your first subject!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Quiz Results */}
          <Card className="border-purple-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-purple-900">Recent Quiz Results</CardTitle>
                <Link to="/analytics">
                  <Button variant="outline" size="sm" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quizzesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading quiz results...</p>
                  </div>
                ) : quizzesError ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-red-500">{quizzesError}</p>
                  </div>
                ) : quizzes.length > 0 ? (
                  quizzes.map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-purple-900">{quiz.subject?.name || 'Unknown Subject'}</h3>
                        <p className="text-sm text-gray-600">
                          {quiz.completed_at ? format(new Date(quiz.completed_at), 'PPp') : 'Unknown date'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">
                          {quiz.score}/{quiz.total_questions}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.round((quiz.score / quiz.total_questions) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No quizzes completed yet. Take your first quiz to see results!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
