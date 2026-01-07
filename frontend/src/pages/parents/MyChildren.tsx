import React, { useState, useEffect } from 'react';
import { User, Calendar, CreditCard, BookOpen, Download, ChevronDown, ChevronUp, TrendingUp, FileText, Award, Clock, ClipboardList } from 'lucide-react';
import api from '../../utils/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: {
    name: string;
  };
  balance: number;
  attendance: {
    date: string;
    status: string;
  }[];
  payments: {
    id: string;
    amount: number;
    paymentDate: string;
    method: string;
    referenceNumber?: string;
  }[];
  feeStructures: {
    id: string;
    amountDue: number;
    amountPaid: number;
    feeTemplate: {
      name: string;
    };
  }[];
  assessmentResults: {
    id: string;
    score: number;
    assessment: {
      title: string;
      totalMarks: number;
      subject: {
        name: string;
      };
    };
  }[];
  pendingAssessments?: {
    id: string;
    title: string;
    type: string;
    date: string;
    subject: {
      name: string;
    };
  }[];
  todaysClasses?: {
    id: string;
    startTime: string;
    endTime: string;
    subject: {
      name: string;
    };
  }[];
  termResults: {
    totalScore: number;
    term: {
      name: string;
    };
  }[];
  termReports: {
    id: string;
    term: {
      name: string;
    };
  }[];
}

const MyChildren = () => {
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFees, setExpandedFees] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await api.get('/students/my-children');
      setChildren(response.data);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... (Keep existing receipt/statement logic)

  // ... (Keep existing prepareChartData)

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Children</h1>

      <div className="space-y-8">
        {children.map((child) => (
          <div key={child.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Enhanced Header - Same as before */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-white/30">
                    {child.firstName[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{child.firstName} {child.lastName}</h2>
                    <div className="flex items-center space-x-3 text-blue-100 text-sm mt-1">
                      <span className="bg-white/20 px-2 py-0.5 rounded">{child.admissionNumber}</span>
                      <span>•</span>
                      <span>{child.class?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3">
                    <p className="text-xs text-blue-100 uppercase font-semibold mb-1">Outstanding Balance</p>
                    <p className={`text-2xl font-bold ${child.balance > 0 ? 'text-red-200' : 'text-green-200'}`}>
                      ZMW {child.balance.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadStatement(child.id)}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/20"
                  >
                    <Download size={14} />
                    Download Statement
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Academic & Schedule (Span 2) */}
              <div className="lg:col-span-2 space-y-6">

                {/* NEW: Daily Overview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Today's Schedule */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-slate-700 flex items-center text-sm">
                        <Clock size={16} className="mr-2 text-blue-500" />
                        Today's Schedule
                      </h4>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {child.todaysClasses && child.todaysClasses.length > 0 ? (
                        child.todaysClasses.map(period => (
                          <div key={period.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                            <div className="w-14 text-center bg-blue-50 rounded p-1">
                              <span className="block text-xs font-bold text-blue-700">{period.startTime}</span>
                              <span className="block text-[10px] text-blue-400">{period.endTime}</span>
                            </div>
                            <div className="flex-1">
                              <span className="block text-sm font-medium text-slate-700 truncate">{period.subject.name}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-xs text-slate-400">No classes scheduled today.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pending Assignments */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-slate-700 flex items-center text-sm">
                        <ClipboardList size={16} className="mr-2 text-purple-500" />
                        Upcoming Tasks
                      </h4>
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                        {child.pendingAssessments?.length || 0} Pending
                      </span>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {child.pendingAssessments && child.pendingAssessments.length > 0 ? (
                        child.pendingAssessments.map(assessment => (
                          <div key={assessment.id} className="p-3 bg-purple-50 border border-purple-100 rounded-lg hover:shadow-sm transition-all">
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${assessment.type === 'QUIZ' ? 'bg-orange-100 text-orange-700' : 'bg-white text-purple-700'
                                }`}>
                                {assessment.type}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(assessment.date).toLocaleDateString()}
                              </span>
                            </div>
                            <h5 className="text-sm font-medium text-slate-800 line-clamp-1" title={assessment.title}>{assessment.title}</h5>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <BookOpen size={10} />
                              {assessment.subject.name}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-xs text-slate-400">No upcoming tasks.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="text-blue-600" size={20} />
                    <h3 className="text-lg font-bold text-slate-800">Academic Performance</h3>
                  </div>

                  {/* Performance Chart - Existing */}
                  <div className="h-64 w-full">
                    {/* ... Existing Chart Logic ... */}
                    {child.termResults && child.termResults.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepareChartData(child.termResults)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="average"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <TrendingUp size={32} className="mb-2 opacity-50" />
                        <p>No performance data available</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Results */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-slate-700 flex items-center">
                        <TrendingUp size={16} className="mr-2 text-blue-500" />
                        Recent Results
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {child.assessmentResults && child.assessmentResults.length > 0 ? (
                        child.assessmentResults.slice(0, 5).map((result) => (
                          <div key={result.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                            <div>
                              <span className="font-medium text-slate-700 block text-sm">{result.assessment.subject.name}</span>
                              <span className="text-xs text-slate-500">{result.assessment.title}</span>
                            </div>
                            <div className="flex items-center">
                              <div className="text-right mr-3">
                                <span className="font-bold text-slate-800 block">{Number(result.score)}</span>
                                <span className="text-[10px] text-slate-400 uppercase">Score</span>
                              </div>
                              <div className={`w-1.5 h-8 rounded-full ${Number(result.score) >= 75 ? 'bg-green-500' :
                                Number(result.score) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <p className="text-sm">No recent results</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Report Cards */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-slate-700 flex items-center">
                        <FileText size={16} className="mr-2 text-blue-500" />
                        Report Cards
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {child.termReports && child.termReports.length > 0 ? (
                        child.termReports.map((report) => (
                          <div key={report.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-blue-600 mr-3 shadow-sm">
                                <FileText size={16} />
                              </div>
                              <span className="text-sm font-medium text-slate-700">{report.term.name}</span>
                            </div>
                            <button className="text-blue-600 hover:text-blue-800 text-xs font-medium px-3 py-1.5 bg-white border border-blue-100 rounded-md hover:bg-blue-50 transition-colors shadow-sm">
                              View
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <p className="text-sm">No report cards available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Finance & Admin (Span 1) */}
              <div className="space-y-6">

                {/* Fee Structure */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div
                    className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleFeeDetails(child.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <CreditCard size={18} className="text-slate-600" />
                      <h3 className="font-semibold text-slate-800">Fee Structure</h3>
                    </div>
                    {expandedFees[child.id] ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>

                  {expandedFees[child.id] && (
                    <div className="p-4 space-y-3">
                      {child.feeStructures && child.feeStructures.length > 0 ? (
                        <>
                          {child.feeStructures.map((fee) => (
                            <div key={fee.id} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                              <span className="text-slate-600">{fee.feeTemplate.name}</span>
                              <span className="font-medium text-slate-900">ZMW {Number(fee.amountDue).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-bold pt-3 mt-1 bg-slate-50 -mx-4 -mb-4 p-4 border-t border-slate-100">
                            <span>Total Fees</span>
                            <span className="text-blue-700">ZMW {child.feeStructures?.reduce((sum, f) => sum + Number(f.amountDue), 0).toLocaleString()}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 italic text-center py-2">No fee structure assigned</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Recent Payments */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <CreditCard size={18} className="text-green-600" />
                    <h3 className="font-semibold text-slate-800">Recent Payments</h3>
                  </div>
                  <div className="space-y-3">
                    {child.payments.length > 0 ? (
                      child.payments.slice(0, 3).map((payment, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 rounded hover:bg-slate-50 transition-colors">
                          <div>
                            <span className="text-slate-500 text-xs block mb-0.5">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                            <span className="font-bold text-slate-800">ZMW {Number(payment.amount).toLocaleString()}</span>
                          </div>
                          <button
                            onClick={() => generateReceipt(child, payment)}
                            className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                            title="Download Receipt"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic text-center py-4">No payment records found</p>
                    )}
                  </div>
                  {child.payments.length > 0 && (
                    <button className="w-full mt-2 text-xs text-blue-600 font-medium hover:underline py-2">
                      View All Payments
                    </button>
                  )}
                </div>

                {/* Attendance Summary */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Calendar size={18} className="text-orange-500" />
                    <h3 className="font-semibold text-slate-800">Recent Attendance</h3>
                  </div>
                  <div className="space-y-3">
                    {child.attendance.length > 0 ? (
                      child.attendance.slice(0, 5).map((record, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">{new Date(record.date).toLocaleDateString()}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${record.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                            record.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                            {record.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic text-center py-4">No attendance records found</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}
        {children.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-300">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <User className="text-slate-400" size={32} />
            </div>
            <h3 className="text-xl font-medium text-slate-900">No children linked</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">Contact the school administration to link your account to your children's profiles.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyChildren;
