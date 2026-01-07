import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Download, Calculator, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import * as XLSX from 'xlsx';

interface Props {
    classId: string;
    subjectId: string;
    termId: string;
    onBack: () => void;
    classNameStr: string;
    subjectNameStr: string;
}

interface Assessment {
    id: string;
    title: string;
    totalMarks: number;
    weight: number;
    type: string;
}

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
}

interface Result {
    assessmentId: string;
    studentId: string;
    score: number;
}

const SubjectGradebook: React.FC<Props> = ({ classId, subjectId, termId, onBack, classNameStr, subjectNameStr }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        assessments: Assessment[];
        students: Student[];
        results: Result[];
    } | null>(null);

    useEffect(() => {
        fetchGradebook();
    }, [classId, subjectId, termId]);

    const fetchGradebook = async () => {
        try {
            setLoading(true);
            const res = await api.get('/assessments/gradebook', {
                params: { classId, subjectId, termId }
            });
            setData(res.data);
        } catch (error) {
            console.error('Failed to fetch gradebook', error);
        } finally {
            setLoading(false);
        }
    };

    const processedData = useMemo(() => {
        if (!data) return { rows: [], totalWeight: 0 };

        const { assessments, students, results } = data;

        // Map results for quick lookup: [studentId][assessmentId] = score
        const resultMap: Record<string, Record<string, number>> = {};
        results.forEach(r => {
            if (!resultMap[r.studentId]) resultMap[r.studentId] = {};
            resultMap[r.studentId][r.assessmentId] = r.score;
        });

        const totalWeight = assessments.reduce((sum, a) => sum + Number(a.weight), 0);

        const rows = students.map(student => {
            let totalWeightedScore = 0;

            const scores = assessments.map(assessment => {
                const rawScore = resultMap[student.id]?.[assessment.id];
                if (rawScore === undefined) return { raw: '-', weighted: 0, percentage: 0 };

                const percentage = rawScore / assessment.totalMarks;
                const weighted = percentage * assessment.weight;
                totalWeightedScore += weighted;

                return {
                    raw: rawScore,
                    weighted,
                    percentage: percentage * 100
                };
            });

            return {
                student,
                scores,
                totalWeightedScore
            };
        });

        // Sort by Total Score DESC
        rows.sort((a, b) => b.totalWeightedScore - a.totalWeightedScore);

        return { rows, totalWeight };
    }, [data]);

    const handleExport = () => {
        if (!data) return;

        // Header Row 1: Assessment Names
        const headers = ['Rank', 'Admission No', 'Student Name', ...data.assessments.map(a => `${a.title} (${a.weight}%)`), 'Total (%)'];

        const wsData: any[][] = [
            [`Subject Gradebook: ${subjectNameStr} - ${classNameStr}`],
            headers
        ];

        processedData.rows.forEach((row, idx) => {
            const scores = row.scores.map(s => s.raw !== '-' ? s.raw : '-');
            wsData.push([
                idx + 1,
                row.student.admissionNumber,
                `${row.student.firstName} ${row.student.lastName}`,
                ...scores,
                row.totalWeightedScore.toFixed(1)
            ]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Gradebook");
        XLSX.writeFile(wb, `Gradebook_${classNameStr}_${subjectNameStr}.xlsx`);
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Gradebook...</div>;
    if (!data) return <div className="p-12 text-center text-red-500">Failed to load data</div>;

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-800 flex items-center mb-2">
                        <ArrowLeft size={18} className="mr-1" /> Back
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calculator className="text-blue-600" />
                        Master Gradebook
                    </h2>
                    <p className="text-gray-500">{classNameStr} • {subjectNameStr}</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className={`px-4 py-2 rounded-lg border ${processedData.totalWeight === 100 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                        <span className="font-bold flex items-center gap-2">
                            {processedData.totalWeight !== 100 && <AlertCircle size={16} />}
                            Total Weight: {processedData.totalWeight}%
                        </span>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <Download size={18} /> Export Excel
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto border border-gray-200 rounded-xl shadow-sm bg-white">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 border-r border-gray-200 w-16 text-center">Pos</th>
                            <th className="px-4 py-3 border-r border-gray-200 min-w-[200px] sticky left-0 bg-gray-50 z-20 shadow-sm">Student</th>
                            {data.assessments.map(a => (
                                <th key={a.id} className="px-4 py-3 border-r border-gray-200 text-center min-w-[100px]">
                                    <div className="text-xs text-gray-500 font-normal">{a.type}</div>
                                    <div className="truncate w-24 mx-auto" title={a.title}>{a.title}</div>
                                    <div className="text-xs text-blue-600 mt-1">{a.weight}%</div>
                                </th>
                            ))}
                            <th className="px-4 py-3 bg-blue-50 text-blue-900 text-center min-w-[80px]">Total %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {processedData.rows.map((row, idx) => (
                            <tr key={row.student.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border-r border-gray-100 text-center text-gray-500">{idx + 1}</td>
                                <td className="px-4 py-2 border-r border-gray-100 font-medium sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                                    <div className="text-gray-900">{row.student.firstName} {row.student.lastName}</div>
                                    <div className="text-xs text-gray-400 font-mono">{row.student.admissionNumber}</div>
                                </td>
                                {row.scores.map((score, sIdx) => {
                                    let color = 'text-gray-800';
                                    if (score.raw === '-') color = 'text-gray-300';
                                    else if (score.percentage < 50) color = 'text-red-600 font-medium';
                                    else if (score.percentage >= 80) color = 'text-green-600 font-medium';

                                    return (
                                        <td key={sIdx} className={`px-4 py-2 border-r border-gray-100 text-center ${color}`}>
                                            {score.raw !== '-' ? (
                                                <div className="flex flex-col">
                                                    <span>{score.raw} <span className="text-gray-400 text-[10px]">/ {data.assessments[sIdx].totalMarks}</span></span>
                                                    <span className="text-[10px] text-gray-400">({score.weighted.toFixed(1)}%)</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                    );
                                })}
                                <td className="px-4 py-2 bg-blue-50 text-center font-bold text-blue-800">
                                    {row.totalWeightedScore.toFixed(1)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SubjectGradebook;
