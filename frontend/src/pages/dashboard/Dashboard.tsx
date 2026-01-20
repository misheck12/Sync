import { useState, useEffect } from 'react';
import { TrendingUp, Users, AlertCircle, BookOpen, Clock, Calendar, CheckSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import api from '../../utils/api';

// Admin Stats Interface
interface AdminStats {
  role: 'ADMIN';
  dailyRevenue: number;
  activeStudents: number;
  outstandingFees: number;
  recentPayments: {
    id: string;
    amount: number;
    method: string;
    createdAt: string;
    student: {
      firstName: string;
      lastName: string;
      class: {
        name: string;
      };
    };
  }[];
}

// Teacher Stats Interface
interface TeacherStats {
  role: 'TEACHER';
  stats: {
    totalStudents: number;
    totalClasses: number;
    todayScheduleCount: number;
    pendingSubmissions: number;
    attendanceRate: number;
    attendanceTaken: boolean;
    upcomingDeadlinesCount: number;
    classesNeedingAttendance: number;
  };
  myClasses: {
    id: string;
    name: string;
    gradeLevel: number;
    _count: { students: number };
  }[];
  todaySchedule: {
    id: string;
    startTime: string;
    endTime: string;
    classId: string;
    class: { name: string };
    subject: { name: string; code: string };
  }[];
  recentAssessments: {
    id: string;
    title: string;
    date: string;
    class: { name: string };
    subject: { name: string };
    _count: { results: number };
  }[];
  homeworkWithPendingGrades: any[];
  upcomingDeadlines: any[];
  recentForumPosts: any[];
  classesNeedingAttendance: any[];
  attendanceStats: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
}

type DashboardData = AdminStats | TeacherStats;

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role !== 'PARENT') {
      fetchStats();
    }
  }, [user]);

  if (user?.role === 'PARENT') {
    return <Navigate to="/my-children" replace />;
  }

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="p-6">Failed to load dashboard data.</div>;
  }

  // --- TEACHER VIEW ---
  if (data?.role === 'TEACHER') {
    const teacherData = data as TeacherStats;
    const { stats, todaySchedule, recentAssessments, myClasses } = teacherData;
    const homeworkWithPendingGrades = (teacherData as any).homeworkWithPendingGrades || [];
    const upcomingDeadlines = (teacherData as any).upcomingDeadlines || [];
    const recentForumPosts = (teacherData as any).recentForumPosts || [];
    const classesNeedingAttendance = (teacherData as any).classesNeedingAttendance || [];
    const attendanceStats = (teacherData as any).attendanceStats || { present: 0, absent: 0, late: 0, total: 0 };

    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.fullName?.split(' ')[0]}! 👋</h1>
            <p className="text-gray-500">Here's what's happening with your classes today.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/teacher/homework" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <BookOpen size={16} />
              Post Homework
            </Link>
            <Link to="/academics/attendance" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              <CheckSquare size={16} />
              Take Attendance
            </Link>
          </div>
        </div>

        {/* Alert: Classes Needing Attendance */}
        {classesNeedingAttendance.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertCircle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">Attendance Not Taken</h3>
              <p className="text-sm text-amber-700 mt-0.5">
                {classesNeedingAttendance.length} class{classesNeedingAttendance.length > 1 ? 'es' : ''} scheduled today still need attendance: {classesNeedingAttendance.map((c: any) => c.name).join(', ')}
              </p>
            </div>
            <Link to="/academics/attendance" className="px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700">
              Mark Now
            </Link>
          </div>
        )}

        {/* Stats Grid - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Users size={20} />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            <p className="text-sm text-gray-500">My Students</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Clock size={20} />
              </div>
              {stats.pendingSubmissions > 0 && (
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Pending</span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingSubmissions || 0}</p>
            <p className="text-sm text-gray-500">To Grade</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stats.attendanceTaken ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                <CheckSquare size={20} />
              </div>
              {stats.attendanceTaken ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Done</span>
              ) : (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Pending</span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate || 0}%</p>
            <p className="text-sm text-gray-500">Attendance</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Calendar size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.todayScheduleCount}</p>
            <p className="text-sm text-gray-500">Classes Today</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-500" />
                  Today's Schedule
                </h2>
                <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {todaySchedule.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Calendar size={40} className="mx-auto mb-2 text-gray-300" />
                    <p>No classes scheduled for today.</p>
                  </div>
                ) : (
                  todaySchedule.map((period) => (
                    <div key={period.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                      <div className="text-center min-w-[70px] bg-blue-50 rounded-lg p-2">
                        <div className="text-sm font-bold text-blue-900">{period.startTime}</div>
                        <div className="text-xs text-blue-600">{period.endTime}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900">{period.subject.name}</div>
                        <div className="text-xs text-gray-500">{period.class.name}</div>
                      </div>
                      <Link
                        to="/academics/attendance"
                        className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                      >
                        Attendance
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Homework to Grade */}
            {homeworkWithPendingGrades.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Clock size={20} className="text-orange-500" />
                    Pending Grading
                  </h2>
                  <Link to="/teacher/homework" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All →
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {homeworkWithPendingGrades.map((hw: any) => (
                    <div key={hw.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <BookOpen size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900">{hw.title}</div>
                        <div className="text-xs text-gray-500">
                          {hw.subjectContent?.class?.name} • {hw.subjectContent?.subject?.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-orange-600">{hw._count?.submissions || 0} submissions</div>
                        <Link
                          to={`/teacher/homework/${hw.id}/submissions`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Grade Now
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Assessments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <CheckSquare size={20} className="text-green-500" />
                  Recent Assessments
                </h2>
                <Link to="/academics/gradebook" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Gradebook →
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentAssessments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No recent assessments found.</div>
                ) : (
                  recentAssessments.map((assessment) => (
                    <div key={assessment.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <BookOpen size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900">{assessment.title}</div>
                        <div className="text-xs text-gray-500">
                          {assessment.class.name} • {assessment.subject.name} • {new Date(assessment.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-gray-900">{assessment._count.results} Graded</div>
                        <Link to="/academics/gradebook" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          View Results
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Attendance Summary */}
            {stats.attendanceTaken && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckSquare size={18} className="text-green-500" />
                  Today's Attendance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Present</span>
                    <span className="text-sm font-bold text-green-600">{attendanceStats.present}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Late</span>
                    <span className="text-sm font-bold text-yellow-600">{attendanceStats.late}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Absent</span>
                    <span className="text-sm font-bold text-red-600">{attendanceStats.absent}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Students</span>
                      <span className="text-sm font-bold text-gray-900">{attendanceStats.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Calendar size={18} className="text-purple-500" />
                  Upcoming Deadlines
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {upcomingDeadlines.length === 0 ? (
                  <div className="p-5 text-center text-sm text-gray-500">No upcoming deadlines</div>
                ) : (
                  upcomingDeadlines.slice(0, 4).map((hw: any) => (
                    <div key={hw.id} className="p-4">
                      <div className="text-sm font-medium text-gray-900 truncate">{hw.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {hw.subjectContent?.class?.name} • Due {new Date(hw.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Forum Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Users size={18} className="text-blue-500" />
                  Student Questions
                </h3>
                <Link to="/forums" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {recentForumPosts.length === 0 ? (
                  <div className="p-5 text-center text-sm text-gray-500">No recent questions</div>
                ) : (
                  recentForumPosts.slice(0, 3).map((post: any) => (
                    <div key={post.id} className="p-4">
                      <div className="text-sm text-gray-900 line-clamp-2">{post.content?.substring(0, 80)}...</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {post.user?.fullName} • {post.forum?.name}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/teacher/homework" className="block p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <BookOpen size={18} />
                    <span className="text-sm font-medium">Create Homework</span>
                  </div>
                </Link>
                <Link to="/teacher/resources" className="block p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={18} />
                    <span className="text-sm font-medium">Upload Resource</span>
                  </div>
                </Link>
                <Link to="/announcements" className="block p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">Post Announcement</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN / BURSAR VIEW (Existing) ---
  const stats = data as AdminStats;
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-sm md:text-base text-gray-500">Welcome back, here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Today</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Today's Collection</h3>
          <p className="text-2xl font-bold text-gray-900">ZMW {stats?.dailyRevenue?.toLocaleString() || '0'}</p>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <AlertCircle size={24} />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Total</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Outstanding Fees</h3>
          <p className="text-2xl font-bold text-gray-900">ZMW {stats?.outstandingFees?.toLocaleString() || '0'}</p>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Active</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Active Students</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.activeStudents || '0'}</p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Recent Payments</h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Class</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No recent payments found</td>
                </tr>
              ) : (
                stats?.recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {payment.student.firstName} {payment.student.lastName}
                    </td>
                    <td className="px-6 py-4">{payment.student.class?.name || 'N/A'}</td>
                    <td className="px-6 py-4">ZMW {Number(payment.amount).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${payment.method === 'CASH' ? 'bg-green-100 text-green-800' :
                          payment.method === 'MOBILE_MONEY' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'}`}>
                        {payment.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Completed</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden">
          {stats?.recentPayments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No recent payments found</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats?.recentPayments.map((payment) => (
                <div key={payment.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{payment.student.firstName} {payment.student.lastName}</p>
                      <p className="text-sm text-gray-500">{payment.student.class?.name || 'N/A'}</p>
                    </div>
                    <span className="font-bold text-gray-900">ZMW {Number(payment.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${payment.method === 'CASH' ? 'bg-green-100 text-green-800' :
                        payment.method === 'MOBILE_MONEY' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'}`}>
                      {payment.method.replace('_', ' ')}
                    </span>
                    <span className="text-gray-500">
                      {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
