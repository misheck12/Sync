import React, { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, CreditCard, Calendar, BookOpen, Users } from 'lucide-react';
import api from '../../utils/api';
import Scholarships from './Scholarships';

interface Payment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  method: 'CASH' | 'MOBILE_MONEY' | 'BANK_DEPOSIT';
  referenceNumber?: string;
  student: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    class?: { id: string; name: string };
  };
  recordedBy: { fullName: string };
}

interface FeeTemplate {
  id: string;
  name: string;
  amount: number;
  academicTermId: string;
  applicableGrade: number;
  academicTerm: { name: string };
}

interface AcademicTerm { id: string; name: string; }
interface Class { id: string; name: string; }

const Finance = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'fees' | 'scholarships'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feeTemplates, setFeeTemplates] = useState<FeeTemplate[]>([]);
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<{ id: string; firstName: string; lastName: string; admissionNumber: string }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateFeeModal, setShowCreateFeeModal] = useState(false);
  const [showAssignFeeModal, setShowAssignFeeModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  const [newFee, setNewFee] = useState({ name: '', amount: '', academicTermId: '', applicableGrade: '' });
  const [assignClassId, setAssignClassId] = useState('');
  const [paymentForm, setPaymentForm] = useState({ studentId: '', amount: '', method: 'CASH', referenceNumber: '' });

  useEffect(() => {
    fetchPayments();
    fetchFeeTemplates();
    fetchAcademicTerms();
    fetchClasses();
    fetchStudents();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchFeeTemplates = async () => {
    try {
      const response = await api.get('/fees/templates');
      setFeeTemplates(response.data);
    } catch (error) {
      console.error('Error fetching fee templates:', error);
    }
  };

  const fetchAcademicTerms = async () => {
    try {
      const response = await api.get('/academic-terms');
      setAcademicTerms(response.data);
    } catch (error) {
      console.error('Error fetching academic terms:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleCreateFee = async () => {
    try {
      await api.post('/fees/templates', {
        ...newFee,
        amount: Number(newFee.amount),
        applicableGrade: Number(newFee.applicableGrade),
      });
      setShowCreateFeeModal(false);
      setNewFee({ name: '', amount: '', academicTermId: '', applicableGrade: '' });
      fetchFeeTemplates();
    } catch (error) {
      console.error('Error creating fee template:', error);
      alert('Failed to create fee template');
    }
  };

  const handleAssignFee = async () => {
    if (!selectedTemplateId || !assignClassId) return;
    try {
      await api.post('/fees/assign-class', { feeTemplateId: selectedTemplateId, classId: assignClassId });
      setShowAssignFeeModal(false);
      setAssignClassId('');
      setSelectedTemplateId(null);
      alert('Fee assigned successfully');
    } catch (error) {
      console.error('Error assigning fee:', error);
      alert('Failed to assign fee');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/payments', { ...paymentForm, amount: Number(paymentForm.amount) });
      setShowAddModal(false);
      setPaymentForm({ studentId: '', amount: '', method: 'CASH', referenceNumber: '' });
      fetchPayments();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'ALL' || payment.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Finance & Payments</h1>
          <p className="text-sm text-slate-500">Manage school fees and transactions</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {activeTab === 'fees' && (
            <button onClick={() => setShowCreateFeeModal(true)}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors flex-1 sm:flex-none justify-center text-sm">
              <Plus size={18} />
              <span className="hidden sm:inline">Create Fee Template</span>
              <span className="sm:hidden">New Fee</span>
            </button>
          )}
          {activeTab === 'payments' && (
            <button onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors flex-1 sm:flex-none justify-center text-sm">
              <Plus size={18} />
              <span className="hidden sm:inline">Record Payment</span>
              <span className="sm:hidden">New Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-full sm:w-fit mb-6 overflow-x-auto">
        {['payments', 'fees', 'scholarships'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)}
            className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-1 sm:flex-none ${
              activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {tab === 'payments' ? 'Payments' : tab === 'fees' ? 'Fee Structures' : 'Scholarships'}
          </button>
        ))}
      </div>

      {activeTab === 'scholarships' ? (
        <Scholarships />
      ) : activeTab === 'payments' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 sm:p-3 bg-green-100 text-green-600 rounded-lg">
                  <DollarSign size={20} />
                </div>
                <span className="text-xs text-slate-500">Total Revenue</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800">ZMW {totalRevenue.toLocaleString()}</h3>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 sm:p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <CreditCard size={20} />
                </div>
                <span className="text-xs text-slate-500">Transactions</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{payments.length}</h3>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 sm:p-3 bg-orange-100 text-orange-600 rounded-lg">
                  <Calendar size={20} />
                </div>
                <span className="text-xs text-slate-500">Pending Fees</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800">ZMW 45,200</h3>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search by student name or ID..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANK_DEPOSIT">Bank Deposit</option>
              </select>
            </div>
          </div>

          {/* Payments - Mobile Cards */}
          <div className="block sm:hidden space-y-3">
            {loading ? (
              <div className="bg-white rounded-xl p-6 text-center text-slate-500">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-slate-500">No payments found</div>
            ) : (
              filteredPayments.map((payment) => (
                <div key={payment.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-slate-800">{payment.student.firstName} {payment.student.lastName}</p>
                      <p className="text-xs text-slate-500">{payment.student.admissionNumber}</p>
                    </div>
                    <p className="font-bold text-slate-800">ZMW {Number(payment.amount).toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      payment.method === 'CASH' ? 'bg-green-100 text-green-800' : 
                      payment.method === 'MOBILE_MONEY' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>{payment.method.replace('_', ' ')}</span>
                    <span className="text-slate-400">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payments - Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-4 font-semibold text-slate-600">Date</th>
                    <th className="px-4 lg:px-6 py-4 font-semibold text-slate-600">Student</th>
                    <th className="px-4 lg:px-6 py-4 font-semibold text-slate-600">Amount</th>
                    <th className="px-4 lg:px-6 py-4 font-semibold text-slate-600">Method</th>
                    <th className="px-4 lg:px-6 py-4 font-semibold text-slate-600 hidden lg:table-cell">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading payments...</td></tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No payments found</td></tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50">
                        <td className="px-4 lg:px-6 py-4 text-slate-600">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="font-medium text-slate-800">{payment.student.firstName} {payment.student.lastName}</div>
                          <div className="text-xs text-slate-500">{payment.student.admissionNumber}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 font-medium text-slate-800">ZMW {Number(payment.amount).toLocaleString()}</td>
                        <td className="px-4 lg:px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.method === 'CASH' ? 'bg-green-100 text-green-800' : 
                            payment.method === 'MOBILE_MONEY' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>{payment.method.replace('_', ' ')}</span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-slate-600 font-mono text-xs hidden lg:table-cell">{payment.referenceNumber || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {feeTemplates.map((template) => (
            <div key={template.id} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 sm:p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                  <BookOpen size={20} />
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Grade {template.applicableGrade}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">{template.name}</h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-4">{template.academicTerm.name}</p>
              <div className="flex items-baseline mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-slate-800">ZMW {Number(template.amount).toLocaleString()}</span>
              </div>
              <button onClick={() => { setSelectedTemplateId(template.id); setShowAssignFeeModal(true); }}
                className="w-full py-2 px-4 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 text-sm">
                <Users size={16} />
                <span>Assign to Class</span>
              </button>
            </div>
          ))}
          
          {feeTemplates.length === 0 && (
            <div className="col-span-full text-center py-8 sm:py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="text-slate-400" size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-slate-900">No fee templates</h3>
              <p className="text-sm text-slate-500 mt-1">Create a fee template to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Record New Payment</h2>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
                <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={paymentForm.studentId} onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}>
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>{student.firstName} {student.lastName} ({student.admissionNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (ZMW)</label>
                <input type="number" required min="0" step="0.01" placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_DEPOSIT">Bank Deposit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference Number</label>
                <input type="text" placeholder="Optional"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={paymentForm.referenceNumber} onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} />
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Fee Template Modal */}
      {showCreateFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Create Fee Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fee Name</label>
                <input type="text" placeholder="e.g. Term 1 Tuition"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newFee.name} onChange={(e) => setNewFee({ ...newFee, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (ZMW)</label>
                <input type="number" placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newFee.amount} onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Academic Term</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newFee.academicTermId} onChange={(e) => setNewFee({ ...newFee, academicTermId: e.target.value })}>
                  <option value="">Select Term</option>
                  {academicTerms.map(term => <option key={term.id} value={term.id}>{term.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Applicable Grade</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={newFee.applicableGrade} onChange={(e) => setNewFee({ ...newFee, applicableGrade: e.target.value })}>
                  <option value="">Select Grade</option>
                  {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Grade {i + 1}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateFeeModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button onClick={handleCreateFee} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Create Template</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Fee Modal */}
      {showAssignFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Assign Fee to Class</h2>
            <p className="text-sm text-slate-500 mb-4">This will assign the selected fee to all active students in the selected class.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)}>
                <option value="">Select Class</option>
                {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button onClick={() => setShowAssignFeeModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
              <button onClick={handleAssignFee} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Assign Fee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
