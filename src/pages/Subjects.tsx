
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubjects } from "@/hooks/useSubjects";
import { CreateSubjectDialog } from "@/components/CreateSubjectDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, FileText, Users, Clock, LogOut } from "lucide-react";

const Subjects = () => {
  const { user, signOut } = useAuth();
  const { subjects, isLoading } = useSubjects();
  const [searchTerm, setSearchTerm] = useState("");

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

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
              <CreateSubjectDialog />
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
                <div className={`w-12 h-12 bg-gradient-to-r ${subject.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <BookOpen className="w-6 h-6 text-white" />
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
                    <Link to={`/subjects/${subject.id}`} className="flex-1">
                      <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        Open
                      </Button>
                    </Link>
                    <Link to={`/quiz?subject=${subject.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50">
                        Quiz
                      </Button>
                    </Link>
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
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search or create a new subject' : 'Get started by creating your first subject'}
            </p>
            <CreateSubjectDialog />
          </div>
        )}
      </div>
    </div>
  );
};

export default Subjects;
