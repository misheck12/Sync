import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AnalyticsDashboard } from '../../services/analyticsService';
import { EmptyState } from '../../components/ui/DesignSystem';

type Props = { data: AnalyticsDashboard };

const money = (value: number) => `ZMW ${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  color: 'var(--text-primary)',
  boxShadow: 'var(--shadow-md)',
};

export default function DashboardCharts({ data }: Props) {
  const weeks = data.revenue.weeklyTrend.map(({ week, amount }) => ({ week, label: shortDate(week), amount }));
  const classes = [...data.enrollment.byGrade]
    .sort((a, b) => b.students - a.students || a.gradeLevel - b.gradeLevel)
    .slice(0, 8);
  const extraClasses = data.enrollment.byGrade.length - classes.length;

  return (
    <section className="dashboard-home__charts" aria-label="School charts">
      <div className="dashboard-home__chart-card ds-surface">
        <div className="dashboard-home__chart-heading">
          <div>
            <h2>Revenue trend</h2>
            <p>Completed payments · last 30 days</p>
          </div>
          {weeks.length > 0 && <strong>{money(data.revenue.totalRevenue)}</strong>}
        </div>
        {weeks.length ? (
          <>
            <div className="dashboard-home__chart-visual" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
                <AreaChart data={weeks} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboard-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary-color)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="var(--primary-color)" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border-color)" strokeDasharray="3 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} dy={8} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={value => Number(value).toLocaleString('en-GB', { notation: 'compact' })} />
                  <Tooltip contentStyle={tooltipStyle} formatter={value => money(Number(value ?? 0))} labelFormatter={(_label, payload) => payload?.[0]?.payload?.week ? `Week of ${shortDate(payload[0].payload.week)}` : ''} />
                  <Area dataKey="amount" name="Collected" type="monotone" stroke="var(--primary-color)" strokeWidth={2.5} fill="url(#dashboard-revenue-fill)" dot={{ r: 3, fill: 'var(--primary-color)' }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="dashboard-home__chart-note">Only weeks with completed payments are plotted.</p>
            <div className="sr-only">
              <table>
                <caption>Completed payment totals by week over the last 30 days</caption>
                <thead><tr><th scope="col">Week</th><th scope="col">Collected</th></tr></thead>
                <tbody>{weeks.map(row => <tr key={row.week}><td>{shortDate(row.week)}</td><td>{money(row.amount)}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        ) : <EmptyState title="No payments in the last 30 days" description="The revenue chart will appear when payments are recorded." />}
      </div>

      <div className="dashboard-home__chart-card ds-surface">
        <div className="dashboard-home__chart-heading">
          <div>
            <h2>Enrollment by class</h2>
            <p>Student records in each class</p>
          </div>
        </div>
        {classes.length ? (
          <>
            <div className="dashboard-home__chart-visual" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
                <BarChart data={classes} layout="vertical" margin={{ top: 7, right: 18, left: 5, bottom: 2 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border-color)" strokeDasharray="3 4" />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <YAxis type="category" dataKey="className" width={95} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={name => String(name).length > 13 ? `${String(name).slice(0, 12)}…` : String(name)} />
                  <Tooltip contentStyle={tooltipStyle} formatter={value => `${Number(value ?? 0)} ${Number(value ?? 0) === 1 ? 'student' : 'students'}`} />
                  <Bar dataKey="students" name="Enrollment" fill="var(--primary-color)" radius={[0, 5, 5, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="dashboard-home__chart-note">{extraClasses > 0 ? `Showing 8 classes with the most students · ${extraClasses} more not shown` : 'Class totals include all student records.'}</p>
            <div className="sr-only">
              <table>
                <caption>Students by class{extraClasses > 0 ? ', eight classes with the most students' : ''}</caption>
                <thead><tr><th scope="col">Class</th><th scope="col">Students</th></tr></thead>
                <tbody>{classes.map((row, index) => <tr key={`${row.className}-${index}`}><td>{row.className}</td><td>{row.students}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        ) : <EmptyState title="No classes yet" description="Enrollment will appear once classes have been created." />}
      </div>
    </section>
  );
}
