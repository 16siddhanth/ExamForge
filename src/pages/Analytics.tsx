import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, BookOpen, Clock, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const Analytics = () => {
  const performanceData = [
    { date: 'Jan 1', score: 75 },
    { date: 'Jan 8', score: 82 },
    { date: 'Jan 15', score: 78 },
    { date: 'Jan 22', score: 85 },
    { date: 'Jan 29', score: 89 },
    { date: 'Feb 5', score: 92 },
    { date: 'Feb 12', score: 88 },
  ];

  const subjectPerformance = [
    { subject: 'Math', score: 92 },
    { subject: 'Physics', score: 85 },
    { subject: 'Chemistry', score: 78 },
    { subject: 'Biology', score: 88 },
    { subject: 'Computer Sci', score: 95 },
  ];

  const recentQuizzes = [
    { id: 1, subject: "Mathematics", topic: "Derivatives", score: 92, total: 100, date: "Feb 12", time: "8 min" },
    { id: 2, subject: "Physics", topic: "Mechanics", score: 85, total: 100, date: "Feb 10", time: "12 min" },
    { id: 3, subject: "Chemistry", topic: "Organic Chemistry", score: 78, total: 100, date: "Feb 8", time: "15 min" },
    { id: 4, subject: "Mathematics", topic: "Integrals", score: 89, total: 100, date: "Feb 6", time: "10 min" },
  ];

  const stats = {
    totalQuizzes: 24,
    averageScore: 87,
    studyStreak: 12,
    timeSpent: 45
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
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  Take Quiz
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Performance Analytics</h1>
          <p className="text-xl text-gray-600">Track your learning progress and identify areas for improvement</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Total Quizzes</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalQuizzes}</div>
              <p className="text-xs text-gray-600">+3 from last week</p>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Average Score</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averageScore}%</div>
              <p className="text-xs text-gray-600">+5% from last month</p>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Study Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.studyStreak} days</div>
              <p className="text-xs text-gray-600">Keep it up!</p>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Time Spent</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.timeSpent}h</div>
              <p className="text-xs text-gray-600">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Trend */}
          <Card className="border-purple-100">
            <CardHeader>
              <CardTitle className="text-purple-900">Performance Trend</CardTitle>
              <CardDescription>Your quiz scores over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subject Performance */}
          <Card className="border-purple-100">
            <CardHeader>
              <CardTitle className="text-purple-900">Subject Performance</CardTitle>
              <CardDescription>Average scores by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="subject" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Quiz History */}
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="text-purple-900">Recent Quiz History</CardTitle>
            <CardDescription>Your latest quiz attempts with detailed results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuizzes.map((quiz) => (
                <div key={quiz.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900">{quiz.subject}</h3>
                    <p className="text-sm text-gray-600">{quiz.topic}</p>
                    <p className="text-xs text-gray-500">{quiz.date} • {quiz.time}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">
                      {quiz.score}/{quiz.total}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.round((quiz.score / quiz.total) * 100)}%
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className={`w-3 h-3 rounded-full ${
                      (quiz.score / quiz.total) >= 0.9 ? 'bg-green-500' :
                      (quiz.score / quiz.total) >= 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
