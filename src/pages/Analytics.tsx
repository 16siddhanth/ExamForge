import { Skeleton } from '@/components/ui/skeleton';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const AnalyticsLoadingSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array(4).fill(0).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array(4).fill(0).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const Analytics = () => {
  const { data: analyticsData, isLoading, error } = useAnalytics();

  if (isLoading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-500">
              Error loading analytics data. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              No quiz data available. Take some quizzes to see your analytics!
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <button
          onClick={() => {
            window.location.reload();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Refresh Data
        </button>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalQuizzes}</div>
            <p className="text-xs text-muted-foreground">
              Completed quizzes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.averageScore}/10</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.totalQuizzes > 0 ? `${Math.round((analyticsData.averageScore / 10) * 100)}% accuracy` : 'No data'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalTimeSpent} min</div>
            <p className="text-xs text-muted-foreground">
              Total study time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.subjectPerformance.length > 0 
                ? analyticsData.subjectPerformance.reduce((best, current) => 
                    current.averageScore > best.averageScore ? current : best
                  ).subject
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Highest average score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'score' ? `${value}/10` : value,
                    name === 'score' ? 'Average Score' : 'Quizzes Taken'
                  ]}
                />
                <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 10]} />
                <Tooltip formatter={(value: number) => [`${value}/10`, 'Average Score']} />
                <Bar dataKey="averageScore" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.scoreDistribution.filter(item => item.count > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({range, percentage}) => `${range}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.scoreDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Quiz Results */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Quiz Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {analyticsData.recentResults.length > 0 ? (
                analyticsData.recentResults.map((result, index) => (
                  <div key={result.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{result.subject}</div>
                      <div className="text-sm text-gray-500">{result.date} at {result.time}</div>
                      {result.timeSpent && (
                        <div className="text-xs text-gray-400">
                          Time: {Math.round(result.timeSpent / 60)}m {result.timeSpent % 60}s
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{result.score}/{result.totalQuestions}</div>
                      <div className="text-sm text-gray-500">
                        {Math.round((result.score / result.totalQuestions) * 100)}%
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No quiz results yet. Take some quizzes to see your analytics!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;