import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AlertCircle, ChevronRight, GraduationCap, Banknote, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Navigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import analyticsService, { type AnalyticsDashboard } from '../../services/analyticsService';
import { PullToRefresh, DashboardSkeleton } from '../../components/mobile';
import { Alert, Button, StatCard } from '../../components/ui/DesignSystem';
import TeacherDashboard from './TeacherDashboard';
import './Dashboard.css';

const DashboardCharts = lazy(() => import('./DashboardCharts'));

interface AdminStats {
  role: 'ADMIN';
  dailyRevenue: number;
  activeStudents: number;
  outstandingFees: number;
  intelligence?: {
    atRiskCount: number;
    unresolvedAlerts: number;
    attendanceRate: number;
  };
}

interface TeacherStats {
  role: 'TEACHER';
  stats: {
    totalStudents: number;
    totalClasses: number;
    todayScheduleCount: number;
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
}

type DashboardData = AdminStats | TeacherStats;

const Dashboard = () => {
  const { user } = useAuth();
  const { settings } = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(false);
  const canViewAnalytics = ['SUPER_ADMIN', 'BURSAR', 'BRANCH_MANAGER'].includes(user?.role || '');

  const fetchStats = useCallback(async () => {
    setError(false);
    try {
      const response = await api.get('/dashboard/stats');
      setData(response.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(false);
    try {
      setAnalytics(await analyticsService.getDashboard(30));
    } catch {
      setAnalytics(null);
      setAnalyticsError(true);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && !['PARENT', 'PLATFORM_ADMIN'].includes(user.role)) void fetchStats();
    if (canViewAnalytics) void fetchAnalytics();
  }, [user, canViewAnalytics, fetchStats, fetchAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await Promise.all([fetchStats(), ...(canViewAnalytics ? [fetchAnalytics()] : [])]); } finally { setRefreshing(false); }
  };

  if (user?.role === 'PARENT') return <Navigate to="/my-children" replace />;
  if (user?.role === 'PLATFORM_ADMIN') return <Navigate to="/ops/tenants" replace />;
  if (loading) return <DashboardSkeleton />;
  if (data?.role === 'TEACHER') return <TeacherDashboard data={data} user={user} onRefresh={handleRefresh} />;

  const stats = data?.role === 'ADMIN' ? data : null;
  const money = (value: number) => `ZMW ${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return <PullToRefresh onRefresh={handleRefresh}>
    <div className="ds-page dashboard-home">
      <header className="dashboard-home__toolbar">
        <div>
          <h1>Dashboard</h1>
          <p>{settings.schoolName} · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} loading={refreshing}>
          {!refreshing && <RefreshCw size={16} aria-hidden="true" />}
          Refresh
        </Button>
      </header>

      {error && (
        <Alert tone="error">
          Unable to load the dashboard. {stats ? 'Previously loaded figures are shown. ' : ''}Select Refresh to try again.
        </Alert>
      )}

      {stats && (
        <>
          <section aria-label="Key school statistics" className="dashboard-home__overview">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Today's collection" value={money(stats.dailyRevenue)} icon={Banknote} detail="Payments received today" />
              <StatCard label="Outstanding fees" value={money(stats.outstandingFees)} icon={AlertCircle} tone="warning" detail="Total balance to collect" />
              <StatCard label="Active students" value={stats.activeStudents.toLocaleString()} icon={GraduationCap} detail="Currently enrolled" />
            </div>
          </section>

          {canViewAnalytics && (
            analyticsLoading && !analytics ? (
              <div className="dashboard-home__chart-loading ds-surface" role="status">Loading school charts…</div>
            ) : analyticsError ? (
              <Alert tone="warning">
                <div className="flex flex-wrap items-center gap-3">
                  <span>Charts are unavailable right now. Your key statistics are still up to date.</span>
                  <Button variant="outline" onClick={fetchAnalytics} loading={analyticsLoading}>Retry charts</Button>
                </div>
              </Alert>
            ) : analytics ? (
              <Suspense fallback={<div className="dashboard-home__chart-loading ds-surface" role="status">Loading school charts…</div>}>
                <DashboardCharts data={analytics} />
              </Suspense>
            ) : null
          )}

          {stats.intelligence && (stats.intelligence.atRiskCount > 0 || stats.intelligence.unresolvedAlerts > 0) && (
            <Alert tone="warning" className="items-center">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <p>
                  <strong>{stats.intelligence.atRiskCount}</strong> at-risk students, <strong>{stats.intelligence.unresolvedAlerts}</strong> attendance alerts, and <strong>{stats.intelligence.attendanceRate}%</strong> weekly attendance.
                </p>
                <Link to="/ai-intelligence" className="inline-flex min-h-11 items-center gap-1 font-semibold underline underline-offset-4">
                  Review alerts
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </Alert>
          )}

        </>
      )}
    </div>
  </PullToRefresh>;
};

export default Dashboard;
