import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Calendar, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import api from '../../utils/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface FinancialReportData {
    monthlyRevenue: number[];
    paymentMethods: { method: string; count: number; amount: number }[];
    classCollection: { className: string; totalDue: number; totalCollected: number; percentage: number }[];
}

const FinanceReports = () => {
    const [data, setData] = useState<FinancialReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const res = await api.get('/payments/reports');
            setData(res.data);
        } catch (error) {
            console.error('Failed to fetch financial reports', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-600 dark:text-gray-400">Loading analytics...</div>;
    if (!data) return <div className="p-8 text-center text-gray-600 dark:text-gray-400">No data available</div>;

    // Prepare chart data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueData = data.monthlyRevenue.map((amount, index) => ({
        name: months[index],
        revenue: amount
    }));

    const methodData = data.paymentMethods.map((m) => ({
        name: m.method.replace('_', ' '),
        value: m.amount
    }));

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Revenue Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            Monthly Revenue ({new Date().getFullYear()})
                        </h3>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `K${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    formatter={(value: number) => [`ZMW ${value.toLocaleString()}`, 'Revenue']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            Revenue by Payment Method
                        </h3>
                    </div>
                    <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={methodData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {methodData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => [`ZMW ${value.toLocaleString()}`, 'Amount']} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Class Collection Performance */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Collection Rate per Class
                </h3>
                <div className="space-y-4">
                    {data.classCollection.map((cls) => (
                        <div key={cls.className} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-slate-700 dark:text-gray-200">{cls.className}</span>
                                <span className="text-slate-500 dark:text-gray-400">
                                    {cls.percentage}% ({cls.totalCollected.toLocaleString()} / {cls.totalDue.toLocaleString()})
                                </span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${cls.percentage >= 80 ? 'bg-emerald-500' :
                                            cls.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${cls.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FinanceReports;
