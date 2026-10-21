import React, { useState, useEffect } from 'react';
import { Printer, School, Phone, Mail, MapPin } from 'lucide-react';
import QRCode from 'qrcode';
import { StudentReport } from '../../services/reportCardService';
import './StudentReportCard.css';

const QUICK_COMMENTS = [
    "Excellent performance, keep it up!",
    "Good progress shown this term.",
    "Satisfactory but allows room for improvement.",
    "Needs to pay more attention in class.",
    "Outstanding academic achievement.",
    "Required to work harder next term.",
    "Participates well in class activities.",
    "A pleasure to have in class."
];

interface StudentReportCardProps {
    report: StudentReport;
    editable?: boolean;
    teacherRemark?: string;
    principalRemark?: string;
    onTeacherRemarkChange?: (value: string) => void;
    onPrincipalRemarkChange?: (value: string) => void;
    onSaveRemarks?: () => void;
    saving?: boolean;
    className?: string; // For adding page-break logic
}

const StudentReportCard: React.FC<StudentReportCardProps> = ({
    report,
    editable = false,
    teacherRemark = '',
    principalRemark = '',
    onTeacherRemarkChange,
    onPrincipalRemarkChange,
    onSaveRemarks,
    saving = false,
    className = ''
}) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    useEffect(() => {
        if (report) {
            // Updated to link to verification page
            const verifyUrl = `${window.location.origin}/verify/report/${report.id}`;
            QRCode.toDataURL(verifyUrl, { margin: 1, width: 100 })
                .then(url => setQrCodeUrl(url))
                .catch(err => console.error(err));
        }
    }, [report]);

    const hasResults = Boolean(report.results?.length);
    const academicYear = report.academicYear || (report.term?.startDate ? String(new Date(report.term.startDate).getFullYear()) : '—');

    return (
        <div className={`student-report ${className}`}>
            <div className="student-report__sheet">
                <header className="student-report__header">
                    <div className="student-report__school">
                        <span className="student-report__logo">
                            {report.school?.logoUrl ? (
                                <img src={report.school.logoUrl} alt="School logo" />
                            ) : (
                                <School size={30} aria-hidden="true" />
                            )}
                        </span>
                        <div className="student-report__school-copy">
                            <p className="student-report__eyebrow">SCHOOL REPORT</p>
                            <h1>{report.school?.schoolName || 'School'}</h1>
                            <div className="student-report__contacts">
                                {report.school?.schoolAddress && <span><MapPin size={12} aria-hidden="true" />{report.school.schoolAddress}</span>}
                                {report.school?.schoolPhone && <span><Phone size={12} aria-hidden="true" />{report.school.schoolPhone}</span>}
                                {report.school?.schoolEmail && <span><Mail size={12} aria-hidden="true" />{report.school.schoolEmail}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="student-report__term-badge">
                        <span>END OF TERM REPORT</span>
                        <strong>{report.term?.name || 'Term not specified'}</strong>
                        <small>Academic year {academicYear}</small>
                    </div>
                </header>

                <div className="student-report__intro">
                    <p className="student-report__eyebrow">STUDENT PROGRESS</p>
                    <h2>{report.student?.firstName} {report.student?.lastName}</h2>
                    <p>A record of learning and achievement for {report.term?.name || 'this term'}.</p>
                </div>

                <section className="student-report__details" aria-label="Student details">
                    <div>
                        <span>Admission number</span>
                        <strong>{report.student?.admissionNumber || '—'}</strong>
                    </div>
                    <div>
                        <span>Class</span>
                        <strong>{report.class?.name || '—'}</strong>
                    </div>
                    <div>
                        <span>Term</span>
                        <strong>{report.term?.name || '—'}</strong>
                    </div>
                    <div>
                        <span>Academic year</span>
                        <strong>{academicYear}</strong>
                    </div>
                </section>

                <section className="student-report__summary" aria-label="Performance summary">
                    <div>
                        <span>Overall average</span>
                        <strong>{hasResults ? `${Number(report.averageScore || 0).toFixed(1)}%` : '—'}</strong>
                        <small>{hasResults ? `${report.results.length} subjects recorded` : 'No results recorded'}</small>
                    </div>
                    <div>
                        <span>Attendance</span>
                        <strong>{report.totalAttendance !== undefined && report.totalDays ? `${report.totalAttendance} / ${report.totalDays}` : '—'}</strong>
                        <small>Days present / school days</small>
                    </div>
                    <div>
                        <span>Class position</span>
                        <strong>{report.rank ? String(report.rank) : '—'}</strong>
                        <small>{report.rank ? 'In class' : 'Not available'}</small>
                    </div>
                </section>

                <section className="student-report__results" aria-labelledby="student-report-results-heading">
                    <div className="student-report__section-heading">
                        <div>
                            <p className="student-report__eyebrow">ACADEMIC PERFORMANCE</p>
                            <h3 id="student-report-results-heading">Subject results</h3>
                        </div>
                        <span>{hasResults ? `${report.results.length} subjects` : 'No results yet'}</span>
                    </div>
                    <div className="student-report__table-wrap" role="region" aria-label="Subject results table" tabIndex={0}>
                    <table className="student-report__table">
                        <thead>
                            <tr>
                                <th scope="col">Subject</th>
                                <th scope="col" className="text-center">Marks</th>
                                <th scope="col" className="text-center">Grade</th>
                                <th scope="col">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.results && report.results.length > 0 ? (
                                report.results.map(result => (
                                    <tr key={result.id}>
                                        <td>{result.subjectName}</td>
                                        <td className="text-center tabular-nums">{Number(result.totalScore).toFixed(1)}</td>
                                        <td className="text-center font-bold">{result.grade}</td>
                                        <td>{result.remarks || '—'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500 italic">No academic results recorded for this term.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </section>

                <section className="student-report__remarks" aria-label="Teacher and head teacher remarks">
                    <div className="student-report__remark">
                        <div className="student-report__remark-heading">
                            <h3>Class teacher's remarks</h3>
                            {editable && (
                                <select
                                    className="student-report__quick-comment print:hidden"
                                    aria-label="Add class teacher quick comment"
                                    onChange={(e) => {
                                        if (e.target.value) onTeacherRemarkChange?.(teacherRemark + (teacherRemark ? '\n' : '') + e.target.value);
                                    }}
                                    value=""
                                >
                                    <option value="">+ Quick Comment</option>
                                    {QUICK_COMMENTS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            )}
                        </div>

                        {editable ? (
                            <>
                                <label className="sr-only" htmlFor={`student-report-teacher-${report.id}`}>Class teacher's remarks</label>
                                <textarea
                                    id={`student-report-teacher-${report.id}`}
                                    value={teacherRemark}
                                    onChange={(e) => onTeacherRemarkChange?.(e.target.value)}
                                    className="student-report__editor print:hidden"
                                    placeholder="Enter remarks..."
                                />
                                <div className="student-report__remark-text hidden print:block">
                                    {teacherRemark || "No remarks provided."}
                                </div>
                            </>
                        ) : (
                            <div className="student-report__remark-text">
                                {report.classTeacherRemark || teacherRemark || "No remarks provided."}
                            </div>
                        )}

                        <div className="student-report__signoff">
                            <span>Signature <i aria-hidden="true" /></span>
                            <span>Date <i aria-hidden="true" /></span>
                        </div>
                    </div>

                    <div className="student-report__remark">
                        <div className="student-report__remark-heading"><h3>Head teacher's remarks</h3></div>
                        {editable ? (
                            <>
                                <label className="sr-only" htmlFor={`student-report-head-${report.id}`}>Head teacher's remarks</label>
                                <textarea
                                    id={`student-report-head-${report.id}`}
                                    value={principalRemark}
                                    onChange={(e) => onPrincipalRemarkChange?.(e.target.value)}
                                    className="student-report__editor print:hidden"
                                    placeholder="Enter remarks..."
                                />
                                <div className="student-report__remark-text hidden print:block">
                                    {principalRemark || "No remarks provided."}
                                </div>
                            </>
                        ) : (
                            <div className="student-report__remark-text">
                                {report.principalRemark || principalRemark || "No remarks provided."}
                            </div>
                        )}

                        <div className="student-report__signoff">
                            <span>Signature &amp; stamp <i aria-hidden="true" /></span>
                            <span>Date <i aria-hidden="true" /></span>
                        </div>
                    </div>
                </section>

                <footer className="student-report__footer">
                    <div className="student-report__footer-note">
                        <strong>About this report</strong>
                        <p>Grades follow the school's configured grading scale.</p>
                        <small>Report ID: {report.id} · Printed {new Date().toLocaleDateString('en-GB')}</small>
                    </div>

                    <div className="student-report__verify">
                        <div>
                            <strong>Scan to verify</strong>
                            <span>Check this report online</span>
                        </div>
                        {qrCodeUrl && (
                            <img src={qrCodeUrl} alt={`Verification QR code for ${report.student?.firstName || 'student'}'s report`} />
                        )}
                    </div>
                </footer>

            </div>

            {/* UI: Print/Save Buttons (Outside the report border) */}
            {editable && (
                <div className="student-report__actions print:hidden">
                    <button
                        onClick={onSaveRemarks}
                        disabled={saving}
                        className="ds-button-primary"
                    >
                        {saving ? 'Saving...' : 'Save Remarks'}
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="ds-button-outline"
                    >
                        <Printer size={16} />
                        Print Official Report
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudentReportCard;
