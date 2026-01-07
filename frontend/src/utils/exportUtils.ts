import * as XLSX from 'xlsx';
import { StudentReport } from '../services/reportCardService';

export const exportToExcel = (reports: StudentReport[], className: string, termName: string) => {
    // 1. Extract all unique subjects
    const subjects = new Set<string>();
    reports.forEach(r => {
        r.results.forEach(res => subjects.add(res.subjectName));
    });
    const subjectList = Array.from(subjects).sort();

    // 2. Prepare Data
    const wsData: any[][] = [
        ['Sync International School - Class Broadsheet'],
        [`Class: ${className}`, `Term: ${termName}`],
        [''],
        ['Rank', 'Student Name', 'Admission No', ...subjectList, 'Total', 'Avg %', 'Attendance']
    ];

    // Sort by rank
    const sortedReports = [...reports].sort((a, b) => (a.rank || 0) - (b.rank || 0));

    sortedReports.forEach(r => {
        const subjectScores: Record<string, number> = {};
        r.results.forEach(res => {
            subjectScores[res.subjectName] = res.totalScore;
        });

        const scores = subjectList.map(s => subjectScores[s] !== undefined ? subjectScores[s] : '-');

        wsData.push([
            r.rank?.toString() || '-',
            `${r.student?.firstName} ${r.student?.lastName}`,
            r.student?.admissionNumber || '',
            ...scores,
            Number(r.totalScore).toFixed(1),
            Number(r.averageScore).toFixed(1),
            `${r.totalAttendance || 0}/${r.totalDays || 60}`
        ]);
    });

    // 3. Create Workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-width (basic)
    const wscols = [{ wch: 5 }, { wch: 25 }, { wch: 15 }];
    subjectList.forEach(() => wscols.push({ wch: 10 }));
    wscols.push({ wch: 10 }, { wch: 10 }, { wch: 15 });
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Broadsheet");
    XLSX.writeFile(wb, `Class_Reports_${className}_${termName}.xlsx`);
};

export const exportToCSV = (reports: StudentReport[], className: string, termName: string) => {
    // Similar logic but manual CSV string construction
    const subjects = new Set<string>();
    reports.forEach(r => r.results.forEach(res => subjects.add(res.subjectName)));
    const subjectList = Array.from(subjects).sort();

    const headers = ['Rank', 'Student Name', 'Admission No', ...subjectList, 'Total', 'Avg %', 'Attendance'];
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add Metadata
    csvContent += `Sync International School - Class Broadsheet\n`;
    csvContent += `Class: ${className},Term: ${termName}\n\n`;
    csvContent += headers.join(",") + "\n";

    const sortedReports = [...reports].sort((a, b) => (a.rank || 0) - (b.rank || 0));

    sortedReports.forEach(r => {
        const subjectScores: Record<string, number> = {};
        r.results.forEach(res => subjectScores[res.subjectName] = res.totalScore);

        const row = [
            r.rank || '-',
            `"${r.student?.firstName} ${r.student?.lastName}"`, // Quote name
            r.student?.admissionNumber || '',
            ...subjectList.map(s => subjectScores[s] !== undefined ? subjectScores[s] : '-'),
            Number(r.totalScore).toFixed(1),
            Number(r.averageScore).toFixed(1),
            `"${r.totalAttendance || 0}/${r.totalDays || 60}"`
        ];
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Class_Reports_${className}_${termName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
