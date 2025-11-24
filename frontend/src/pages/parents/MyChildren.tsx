import React, { useState, useEffect } from 'react';
import { User, Calendar, CreditCard, BookOpen } from 'lucide-react';
import api from '../../utils/api';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: {
    name: string;
  };
  attendance: {
    date: string;
    status: string;
  }[];
  payments: {
    amount: number;
    paymentDate: string;
    method: string;
  }[];
}

const MyChildren = () => {
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Children</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {children.map((child) => (
          <div key={child.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  {child.firstName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{child.firstName} {child.lastName}</h2>
                  <p className="text-sm text-slate-500">{child.admissionNumber} • {child.class?.name}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Attendance Summary */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar size={18} className="text-slate-400" />
                  <h3 className="font-semibold text-slate-700">Recent Attendance</h3>
                </div>
                <div className="space-y-2">
                  {child.attendance.length > 0 ? (
                    child.attendance.map((record, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600">{new Date(record.date).toLocaleDateString()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                          record.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic">No attendance records found</p>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <CreditCard size={18} className="text-slate-400" />
                  <h3 className="font-semibold text-slate-700">Recent Payments</h3>
                </div>
                <div className="space-y-2">
                  {child.payments.length > 0 ? (
                    child.payments.map((payment, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                        <span className="font-medium text-slate-800">ZMW {Number(payment.amount).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic">No payment records found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {children.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <User className="text-slate-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No children linked</h3>
            <p className="text-slate-500 mt-1">Contact the school administration to link your account to your children.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyChildren;
