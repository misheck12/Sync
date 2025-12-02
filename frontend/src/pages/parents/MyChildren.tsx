import React, { useState, useEffect } from 'react';
import { User, Calendar, CreditCard, BookOpen, Download, ChevronDown, ChevronUp, TrendingUp, FileText, Award } from 'lucide-react';
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

  const toggleFeeDetails = (studentId: string) => {
    setExpandedFees(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const generateReceipt = async (child: Student, payment: any) => {
    const doc = new jsPDF();
    const primaryColor = [37, 99, 235]; // Blue-600
    const secondaryColor = [100, 116, 139]; // Slate-500
    
    // --- Header Background ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');

    // --- Header Text ---
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT RECEIPT', 14, 25);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sync School Management', 200, 20, { align: 'right' });
    doc.text('official@syncschool.com', 200, 28, { align: 'right' });

    // --- Receipt Info Section ---
    doc.setTextColor(0, 0, 0);
    const startY = 55;
    
    // Left Column: Student Details
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('BILLED TO', 14, startY);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${child.firstName} ${child.lastName}`, 14, startY + 7);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Admission No: ${child.admissionNumber}`, 14, startY + 13);
    doc.text(`Class: ${child.class?.name}`, 14, startY + 19);

    // Right Column: Payment Details
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('RECEIPT DETAILS', 140, startY);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Receipt No:`, 140, startY + 7);
    doc.text(payment.id.substring(0, 8).toUpperCase(), 170, startY + 7);
    
    doc.text(`Date:`, 140, startY + 13);
    doc.text(new Date(payment.paymentDate).toLocaleDateString(), 170, startY + 13);
    
    doc.text(`Method:`, 140, startY + 19);
    doc.text(payment.method.replace('_', ' '), 170, startY + 19);

    if (payment.referenceNumber) {
      doc.text(`Reference:`, 140, startY + 25);
      doc.text(payment.referenceNumber, 170, startY + 25);
    }

    // --- Table ---
    autoTable(doc, {
      startY: startY + 35,
      head: [['Description', 'Amount (ZMW)']],
      body: [
        ['Tuition/School Fees Payment', Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })],
      ],
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 50, halign: 'right' },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // --- Total Section ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    // Move label further left to avoid overlap with the amount
    doc.text('Total Amount Paid:', 100, finalY + 15);
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`ZMW ${Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 195, finalY + 15, { align: 'right' });

    // --- QR Code ---
    try {
      // Data to encode: Receipt ID, Student ID, Amount, Date - could be a verification URL in production
      const qrData = JSON.stringify({
        receipt: payment.id,
        student: child.admissionNumber,
        amount: payment.amount,
        date: payment.paymentDate
      });
      
      const qrDataUrl = await QRCode.toDataURL(qrData, { width: 100, margin: 1 });
      doc.addImage(qrDataUrl, 'PNG', 14, finalY + 10, 30, 30);
      
      doc.setFontSize(8);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Scan to verify', 14, finalY + 42);
    } catch (err) {
      console.error('Error generating QR code', err);
    }

    // --- Footer ---
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 270, 196, 270);
    
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('Thank you for your payment.', 105, 275, { align: 'center' });
    doc.text('This is a computer generated receipt and does not require a signature.', 105, 280, { align: 'center' });

    doc.save(`Receipt_${child.firstName}_${new Date(payment.paymentDate).toISOString().split('T')[0]}.pdf`);
  };

  const prepareChartData = (termResults: Student['termResults']) => {
    // Group by term and calculate average
    const termGroups: Record<string, { total: number; count: number }> = {};
    
    termResults.forEach(result => {
      const termName = result.term.name;
      if (!termGroups[termName]) {
        termGroups[termName] = { total: 0, count: 0 };
      }
      termGroups[termName].total += Number(result.totalScore);
      termGroups[termName].count += 1;
    });

    return Object.keys(termGroups).map(term => ({
      name: term,
      average: Math.round(termGroups[term].total / termGroups[term].count)
    }));
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Children</h1>
      
      <div className="space-y-8">
        {children.map((child) => (
          <div key={child.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Enhanced Header */}
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
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 min-w-[200px]">
                  <p className="text-xs text-blue-100 uppercase font-semibold mb-1">Outstanding Balance</p>
                  <p className={`text-2xl font-bold ${child.balance > 0 ? 'text-red-200' : 'text-green-200'}`}>
                    ZMW {child.balance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Academic Performance (Span 2) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="text-blue-600" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">Academic Performance</h3>
                </div>
                
                {/* Performance Chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-600 mb-4">Term Performance History</h4>
                  {child.termResults && child.termResults.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepareChartData(child.termResults)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                            dy={10}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                          />
                          <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="average" 
                            stroke="#2563eb" 
                            strokeWidth={3} 
                            dot={{fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff'}}
                            activeDot={{r: 6, strokeWidth: 0}}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <TrendingUp size={32} className="mb-2 opacity-50" />
                      <p>No performance data available yet</p>
                    </div>
                  )}
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
                              <div className={`w-1.5 h-8 rounded-full ${
                                Number(result.score) >= 75 ? 'bg-green-500' : 
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
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                            record.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
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
