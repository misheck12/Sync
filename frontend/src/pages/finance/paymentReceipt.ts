import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import api from '../../utils/api';

interface ReceiptPayment {
  id: string;
  amount: number;
  paymentDate: string;
  method: string;
  transactionId?: string;
  status?: string;
  student: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    class?: { name: string };
  };
  recordedBy: { fullName: string };
  allocations?: {
    amount: number;
    studentFee?: { feeTemplate?: { name: string } };
  }[];
}

interface ReceiptSchool {
  schoolName?: string;
  schoolAddress?: string | null;
  schoolPhone?: string | null;
  schoolEmail?: string | null;
  primaryColor?: string;
  accentColor?: string;
}

type RGB = [number, number, number];
const ink: RGB = [29, 44, 62];
const muted: RGB = [94, 111, 130];
const edge: RGB = [223, 231, 239];
const paper: RGB = [246, 249, 252];
const currency = (amount: number) => `ZMW ${Number(amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function hexToRgb(value: string | undefined, fallback: RGB): RGB {
  const hex = value?.trim().replace(/^#/, '');
  if (!hex || !/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) return fallback;
  const full = hex.length === 3 ? hex.split('').map(character => character + character).join('') : hex;
  return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16)) as RGB;
}

export async function createPaymentReceipt(payment: ReceiptPayment): Promise<jsPDF> {
  if (payment.status === 'VOIDED') throw new Error('A voided payment cannot have a receipt.');

  const response = await api.get<ReceiptSchool>('/settings/public');
  const school = response.data;
  const schoolName = school.schoolName || 'School';
  const primary = hexToRgb(school.primaryColor, [0, 71, 171]);
  const accent = hexToRgb(school.accentColor, [255, 153, 51]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 18;
  const right = pageWidth - left;
  const receiptNumber = payment.id.slice(0, 8).toUpperCase();
  const paidOn = new Date(payment.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const studentName = `${payment.student.firstName} ${payment.student.lastName}`.trim();

  // This QR contains reference details, not an assertion of independent verification.
  const qrImage = await QRCode.toDataURL(JSON.stringify({
    receiptId: payment.id,
    transactionId: payment.transactionId || null,
    amount: Number(payment.amount),
    currency: 'ZMW',
    paymentDate: payment.paymentDate,
  }), { width: 140, margin: 1, color: { dark: '#1d2c3e', light: '#ffffff' } });

  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(...accent);
  doc.rect(right - 38, 5, 38, 1.5, 'F');

  doc.setFillColor(...primary);
  doc.roundedRect(left, 21, 16, 16, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(schoolName.trim().charAt(0).toUpperCase(), left + 8, 31.5, { align: 'center' });

  doc.setTextColor(...primary);
  doc.setFontSize(14);
  const nameLines = doc.splitTextToSize(schoolName, right - (left + 24));
  doc.text(nameLines, left + 23, 25);
  let headerY = 25 + nameLines.length * 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  for (const contact of [school.schoolAddress, [school.schoolPhone, school.schoolEmail].filter(Boolean).join('  |  ')]) {
    if (!contact) continue;
    const lines = doc.splitTextToSize(contact, right - (left + 24));
    doc.text(lines, left + 23, headerY);
    headerY += lines.length * 4.5;
  }
  const dividerY = Math.max(headerY + 7, 53);
  doc.setDrawColor(...edge);
  doc.line(left, dividerY, right, dividerY);

  const heroY = dividerY + 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primary);
  doc.text('PAYMENT RECEIPT', left, heroY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(`#${receiptNumber}`, left, heroY + 7);

  doc.setFillColor(...paper);
  doc.roundedRect(right - 47, heroY - 5.5, 47, 11, 5.5, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primary);
  doc.text('PAYMENT RECORDED', right - 23.5, heroY + 1.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text('TOTAL RECEIVED', left, heroY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...ink);
  doc.text(currency(Number(payment.amount)), left, heroY + 33);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(`Paid on ${paidOn}`, left, heroY + 41);

  const boxY = heroY + 51;
  const boxWidth = (right - left - 7) / 2;
  const secondX = left + boxWidth + 7;
  for (const x of [left, secondX]) {
    doc.setFillColor(...paper);
    doc.roundedRect(x, boxY, boxWidth, 62, 3, 3, 'F');
  }
  const label = (text: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text(text, x, y);
  };
  const value = (text: string, x: number, y: number, width: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...ink);
    doc.text(doc.splitTextToSize(text, width).slice(0, 2), x, y);
  };

  label('STUDENT', left + 7, boxY + 10);
  value(studentName, left + 7, boxY + 18, boxWidth - 14);
  label('ADMISSION NUMBER', left + 7, boxY + 29);
  value(payment.student.admissionNumber || 'Not provided', left + 7, boxY + 37, boxWidth - 14);
  label('CLASS', left + 7, boxY + 47);
  value(payment.student.class?.name || 'Not assigned', left + 7, boxY + 55, boxWidth - 14);

  label('METHOD', secondX + 7, boxY + 10);
  value(payment.method.replace(/_/g, ' '), secondX + 7, boxY + 18, boxWidth - 14);
  label('REFERENCE', secondX + 7, boxY + 29);
  value(payment.transactionId || 'Not provided', secondX + 7, boxY + 37, boxWidth - 14);
  label('RECORDED BY', secondX + 7, boxY + 47);
  value(payment.recordedBy?.fullName || 'School office', secondX + 7, boxY + 55, boxWidth - 14);

  const allocations = payment.allocations || [];
  const allocated = allocations.reduce((sum, item) => sum + Number(item.amount), 0);
  const unapplied = Math.max(0, Number(payment.amount) - allocated);
  const lines = allocations.map(item => [
    item.studentFee?.feeTemplate?.name || 'School fee allocation',
    Number(item.amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  ]);
  if (unapplied > 0.009 || lines.length === 0) {
    lines.push(['Payment received - not yet applied to a fee', unapplied.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })]);
  }

  autoTable(doc, {
    startY: boxY + 74,
    head: [['PAYMENT ALLOCATION', 'AMOUNT (ZMW)']],
    body: lines,
    theme: 'plain',
    margin: { left, right: left, bottom: 52 },
    headStyles: { fillColor: paper, textColor: muted, fontStyle: 'bold', fontSize: 8, cellPadding: 4 },
    bodyStyles: { textColor: ink, fontSize: 10, cellPadding: 5, lineColor: edge, lineWidth: { bottom: 0.2 } },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    showHead: 'everyPage',
  });

  let footerY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;
  if (footerY + 35 > pageHeight - 12) {
    doc.addPage();
    footerY = 22;
  }

  // Keep the total and reference together rather than reserving a second footer row.
  doc.setFillColor(...paper);
  doc.roundedRect(left, footerY, right - left, 35, 3, 3, 'F');
  doc.addImage(qrImage, 'PNG', left + 5, footerY + 5, 25, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primary);
  doc.text('RECEIPT REFERENCE', left + 35, footerY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text(payment.id, left + 35, footerY + 16);
  doc.text('QR contains reference details only.', left + 35, footerY + 23);
  doc.text('Confirm with the school office.', left + 35, footerY + 28);

  doc.setFillColor(...primary);
  doc.roundedRect(right - 72, footerY, 72, 35, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL PAID', right - 63, footerY + 12);
  doc.setFontSize(16);
  doc.text(currency(Number(payment.amount)), right - 9, footerY + 24, { align: 'right' });

  doc.setTextColor(...muted);
  doc.setFontSize(7);
  doc.text(`Generated ${new Date().toLocaleString('en-GB')}`, right, pageHeight - 7, { align: 'right' });

  return doc;
}

export default async function downloadPaymentReceipt(payment: ReceiptPayment): Promise<void> {
  const doc = await createPaymentReceipt(payment);
  const lastName = payment.student.lastName.replace(/[^a-z0-9-_]/gi, '_');
  const receiptNumber = payment.id.slice(0, 8).toUpperCase();
  doc.save(`receipt_${lastName}_${receiptNumber.toLowerCase()}.pdf`);
}
