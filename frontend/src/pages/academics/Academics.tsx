import React, { useState } from 'react';
import Subjects from '../subjects/Subjects';
import Classes from '../classes/Classes';
import Terms from '../terms/Terms';
import Assessments from './Assessments';
import GradingScales from './GradingScales';
import ReportCards from './ReportCards';
import Timetable from './Timetable';
import Promotions from './Promotions';

const Academics = () => {
  const [view, setView] = useState<'classes' | 'subjects' | 'terms' | 'assessments' | 'grading' | 'reports' | 'timetable' | 'promotions'>('classes');

  const tabs = [
    { id: 'classes', label: 'Classes' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'timetable', label: 'Timetable' },
    { id: 'assessments', label: 'Assessments' },
    { id: 'grading', label: 'Grading Scales' },
    { id: 'reports', label: 'Report Cards' },
    { id: 'terms', label: 'Terms' },
    { id: 'promotions', label: 'Promotions' },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Academic Management</h1>
        
        <div className="bg-white p-1 rounded-lg border border-gray-200 flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as any)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                view === tab.id 
                  ? 'bg-blue-100 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        {view === 'classes' && <Classes />}
        {view === 'subjects' && <Subjects />}
        {view === 'assessments' && <Assessments />}
        {view === 'grading' && <GradingScales />}
        {view === 'reports' && <ReportCards />}
        {view === 'timetable' && <Timetable />}
        {view === 'terms' && <Terms />}
        {view === 'promotions' && <Promotions />}
      </div>
    </div>
  );
};

export default Academics;
