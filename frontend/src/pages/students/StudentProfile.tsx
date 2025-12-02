import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { 
  User, 
  CreditCard, 
  Calendar, 
  Phone, 
  MapPin, 
  ArrowLeft, 
  DollarSign,
  Clock,
  FileText,
  Edit2,
  History,
  GraduationCap
} from 'lucide-react';

interface Payment {
  id: string;
  amount: string;
  paymentDate: string;
  method: string;
  referenceNumber: string;
}

interface ClassMovement {
  id: string;
  fromClass: { name: string } | null;
  toClass: { name: string };
  reason: string;
  changedBy: { fullName: string } | null;
  createdAt: string;
}

interface FeeStructure {
  id: string;
  amountDue: string;
  amountPaid: string;
  feeTemplate: {
    name: string;
  };
}

interface Scholarship {
  id: string;
  name: string;
  percentage: number;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  dateOfBirth: string;
  gender: string;
  class: {
    name: string;
  };
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  address: string;
  status: string;
  scholarshipId?: string;
  scholarship?: Scholarship;
  payments: Payment[];
  feeStructures: FeeStructure[];
  classMovements: ClassMovement[];
}

const StudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'CASH',
    referenceNumber: ''
  });

  const fetchStudent = async () => {
    try {
      const response = await api.get(`/students/${id}`);
      setStudent(response.data);
    } catch (error) {
      console.error('Failed to fetch student details', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScholarships = async () => {
    try {
      const response = await api.get('/scholarships');
      setScholarships(response.data);
    } catch (error) {
      console.error('Failed to fetch scholarships', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStudent();
      fetchScholarships();
    }
  }, [id]);

  const handleScholarshipUpdate = async (scholarshipId: string | null) => {
    if (!student) return;
    try {
      await api.put(`/students/${student.id}`, { scholarshipId });
      setShowScholarshipModal(false);
      fetchStudent();
    } catch (error) {
      console.error('Failed to update scholarship', error);
      alert('Failed to update scholarship');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    try {
      await api.post('/payments', {
        studentId: student.id,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        referenceNumber: paymentForm.referenceNumber
      });
      
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', method: 'CASH', referenceNumber: '' });
      fetchStudent(); // Refresh data
    } catch (error) {
      console.error('Failed to record payment', error);
      alert('Failed to record payment');
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!student) return;
    try {
      await api.put(`/students/${student.id}`, { status: newStatus });
      setShowStatusModal(false);
      fetchStudent();
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading profile...</div>;
  }

  if (!student) {
    return <div className="p-6 text-center">Student not found</div>;
  }

  // Calculate Financials
  const totalBilled = student.feeStructures.reduce((sum, fee) => sum + Number(fee.amountDue), 0);
  const totalPaid = student.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const balance = totalBilled - totalPaid;
  const isCredit = balance < 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button 
        onClick={() => navigate('/students')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Students
      </button>

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
              <div className="flex items-center gap-2 text-gray-500 mt-1">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">{student.admissionNumber}</span>
                <span>•</span>
                <span>{student.class?.name || 'No Class'}</span>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    student.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {student.status}
                  </span>
                  <button 
                    onClick={() => setShowStatusModal(true)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                    title="Change Status"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CreditCard size={18} />
            Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-gray-400" />
              Personal Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Guardian</label>
                <p className="text-gray-900 font-medium">{student.guardianName}</p>
                {student.guardianEmail && (
                  <p className="text-sm text-gray-500">{student.guardianEmail}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Contact</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone size={16} className="text-gray-400" />
                  <p className="text-gray-900">{student.guardianPhone}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Address</label>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin size={16} className="text-gray-400 mt-0.5" />
                  <p className="text-gray-900">{student.address || 'No address recorded'}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Date of Birth</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar size={16} className="text-gray-400" />
                  <p className="text-gray-900">{new Date(student.dateOfBirth).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Scholarship</label>
                  <button 
                    onClick={() => setShowScholarshipModal(true)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    {student.scholarship ? 'Change' : 'Add'}
                  </button>
                </div>
                {student.scholarship ? (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-purple-700 font-medium mb-1">
                      <GraduationCap size={16} />
                      {student.scholarship.name}
                    </div>
                    <p className="text-sm text-purple-600">{student.scholarship.percentage}% Discount</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No scholarship assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financials & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <FileText size={18} />
                <span className="text-sm font-medium">Total Billed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">ZMW {totalBilled.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <DollarSign size={18} />
                <span className="text-sm font-medium">Total Paid</span>
              </div>
              <p className="text-2xl font-bold text-green-700">ZMW {totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className={`flex items-center gap-2 ${isCredit ? 'text-green-600' : 'text-red-600'} mb-2`}>
                <Clock size={18} />
                <span className="text-sm font-medium">{isCredit ? 'Credit Balance' : 'Balance Due'}</span>
              </div>
              <p className={`text-2xl font-bold ${isCredit ? 'text-green-700' : 'text-red-700'}`}>
                ZMW {Math.abs(balance).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <FileText size={20} className="text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Fee Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Fee Name</th>
                    <th className="px-6 py-3 font-medium text-right">Amount Due</th>
                    <th className="px-6 py-3 font-medium text-right">Amount Paid</th>
                    <th className="px-6 py-3 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {student.feeStructures.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No fees assigned</td>
                    </tr>
                  ) : (
                    student.feeStructures.map((fee) => (
                      <tr key={fee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {fee.feeTemplate.name}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900">
                          ZMW {Number(fee.amountDue).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-green-600">
                          ZMW {Number(fee.amountPaid).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                          ZMW {(Number(fee.amountDue) - Number(fee.amountPaid)).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Payment History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Method</th>
                    <th className="px-6 py-3 font-medium">Reference</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {student.payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No payments recorded</td>
                    </tr>
                  ) : (
                    student.payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600 capitalize">
                          {payment.method.replace('_', ' ').toLowerCase()}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                          {payment.referenceNumber || '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          ZMW {Number(payment.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Class History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <History size={20} className="text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Class History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">From</th>
                    <th className="px-6 py-3 font-medium">To</th>
                    <th className="px-6 py-3 font-medium">Reason</th>
                    <th className="px-6 py-3 font-medium">Changed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {student.classMovements?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No class movements recorded</td>
                    </tr>
                  ) : (
                    student.classMovements?.map((movement) => (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {movement.fromClass?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {movement.toClass.name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {movement.reason || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {movement.changedBy?.fullName || 'System'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Update Status</h2>
            <div className="space-y-2">
              {['ACTIVE', 'TRANSFERRED', 'GRADUATED', 'DROPPED_OUT'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    student.status === status 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{status}</div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowStatusModal(false)}
              className="mt-4 w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showScholarshipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Assign Scholarship</h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              <button
                onClick={() => handleScholarshipUpdate(null)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  !student.scholarshipId
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-medium">None</div>
                <div className="text-xs opacity-75">Remove scholarship</div>
              </button>
              
              {scholarships.map((scholarship) => (
                <button
                  key={scholarship.id}
                  onClick={() => handleScholarshipUpdate(scholarship.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    student.scholarshipId === scholarship.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{scholarship.name}</div>
                  <div className="text-xs opacity-75">{scholarship.percentage}% Discount</div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowScholarshipModal(false)}
              className="mt-4 w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Record Payment</h2>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">ZMW</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_DEPOSIT">Bank Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
