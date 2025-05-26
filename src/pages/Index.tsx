
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, BookOpen, CheckCircle, FileText, Upload, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ExamForge
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/dashboard" className="text-gray-600 hover:text-purple-600 transition-colors">
                Dashboard
              </Link>
              <Link to="/subjects" className="text-gray-600 hover:text-purple-600 transition-colors">
                Subjects
              </Link>
              <Link to="/analytics" className="text-gray-600 hover:text-purple-600 transition-colors">
                Analytics
              </Link>
              <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Link to="/dashboard">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Exam
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block">
              Preparation Platform
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your study materials with intelligent OCR, AI-generated questions, and comprehensive analytics. 
            Create, manage, and master exams with cutting-edge technology.
          </p>          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Link to="/dashboard">Start Learning</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful Features for Modern Learning
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-purple-100 hover:border-purple-200">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-900">Smart Document Upload</CardTitle>
                <CardDescription>
                  Upload PDFs and DOCX files with advanced OCR technology that automatically extracts questions and content.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-purple-100 hover:border-purple-200">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-900">AI Question Generation</CardTitle>
                <CardDescription>
                  Generate practice questions and sample exams using AI that adapts to your study materials and learning patterns.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-purple-100 hover:border-purple-200">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-900">Interactive Quizzes</CardTitle>
                <CardDescription>
                  Take interactive quizzes with real-time scoring, detailed explanations, and progress tracking.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-purple-100 hover:border-purple-200">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-900">Subject Organization</CardTitle>
                <CardDescription>
                  Organize your study materials by subjects and topics for a structured learning approach.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-purple-100 hover:border-purple-200">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-900">Performance Analytics</CardTitle>
                <CardDescription>
                  Track your progress with detailed analytics, identify weak areas, and monitor improvement over time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-purple-100 hover:border-purple-200">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-purple-900">Collaborative Learning</CardTitle>
                <CardDescription>
                  Share study materials and collaborate with classmates to enhance your learning experience.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Study Experience?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of students who are already using ExamForge to excel in their exams.
          </p>
          <Button asChild size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
            <Link to="/dashboard">Get Started Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-purple-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ExamForge
              </span>
            </div>
            <p className="text-gray-600">© 2024 ExamForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
