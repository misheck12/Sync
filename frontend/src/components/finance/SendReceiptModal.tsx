import React, { useState, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import api from '../../utils/api';
import { Payment } from '../../types';

interface SendReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment: Payment | null;
}

const SendReceiptModal: React.FC<SendReceiptModalProps> = ({ isOpen, onClose, payment }) => {
    const [receiptForm, setReceiptForm] = useState({ email: '', phone: '', sendEmail: true, sendSms: true });

    useEffect(() => {
        if (isOpen) {
            setReceiptForm({ email: '', phone: '', sendEmail: true, sendSms: true });
        }
    }, [isOpen]);

    if (!isOpen || !payment) return null;

    const handleConfirmedSendReceipt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payment) return;

        try {
            await api.post(`/payments/${payment.id}/receipt/send`, receiptForm);
            alert('Receipt sent successfully'); // TODO: Replace with Toast
            onClose();
        } catch (error) {
            console.error('Error sending receipt:', error);
            alert('Failed to send receipt');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-lg font-bold text-slate-800">Send Payment Receipt</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">Confirm contact details</p>

                <form onSubmit={handleConfirmedSendReceipt} className="space-y-4">
                    {/* Email Section */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="sendEmail"
                                checked={receiptForm.sendEmail}
                                onChange={(e) => setReceiptForm({ ...receiptForm, sendEmail: e.target.checked })}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="sendEmail" className="text-sm font-medium text-slate-700">Send Email</label>
                        </div>
                        {receiptForm.sendEmail && (
                            <div>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder={`Default: ${payment.student.parent?.email || payment.student.guardianEmail || 'None'}`}
                                    value={receiptForm.email}
                                    onChange={(e) => setReceiptForm({ ...receiptForm, email: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 mt-1">Leave blank to use default email.</p>
                            </div>
                        )}
                    </div>

                    {/* SMS Section */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="sendSms"
                                checked={receiptForm.sendSms}
                                onChange={(e) => setReceiptForm({ ...receiptForm, sendSms: e.target.checked })}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="sendSms" className="text-sm font-medium text-slate-700">Send SMS</label>
                        </div>
                        {receiptForm.sendSms && (
                            <div>
                                <input
                                    type="tel"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder={`Default: ${payment.student.guardianPhone || 'None'}`}
                                    value={receiptForm.phone}
                                    onChange={(e) => setReceiptForm({ ...receiptForm, phone: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 mt-1">Leave blank to use default phone.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!receiptForm.sendEmail && !receiptForm.sendSms}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            <Send size={16} />
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SendReceiptModal;
