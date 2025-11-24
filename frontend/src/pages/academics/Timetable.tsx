import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, BookOpen, Plus, Trash2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface TimetablePeriod {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacher?: {
    id: string;
    fullName: string;
  };
  class?: {
    id: string;
    name: string;
  };
}

interface Class {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  fullName: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface AcademicTerm {
  id: string;
  name: string;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

const Timetable = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'CLASS' | 'TEACHER'>('CLASS');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [currentTerm, setCurrentTerm] = useState<AcademicTerm | null>(null);
  
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [newPeriod, setNewPeriod] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '08:00',
    endTime: '08:40',
    subjectId: '',
    teacherId: '',
    classId: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (currentTerm) {
      if (viewMode === 'CLASS' && selectedClassId) {
        fetchClassTimetable();
      } else if (viewMode === 'TEACHER' && selectedTeacherId) {
        fetchTeacherTimetable();
      }
    }
  }, [viewMode, selectedClassId, selectedTeacherId, currentTerm]);

  const fetchInitialData = async () => {
    try {
      const [termsRes, classesRes, teachersRes, subjectsRes] = await Promise.all([
        api.get('/academic-terms'),
        api.get('/classes'),
        api.get('/users/teachers'),
        api.get('/subjects')
      ]);

      const activeTerm = termsRes.data.find((t: any) => t.isActive) || termsRes.data[0];
      setCurrentTerm(activeTerm);
      setClasses(classesRes.data);
      setTeachers(teachersRes.data);
      setSubjects(subjectsRes.data);

      if (user?.role === 'TEACHER') {
        setViewMode('TEACHER');
        setSelectedTeacherId(user.id);
      } else if (classesRes.data.length > 0) {
        setSelectedClassId(classesRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchClassTimetable = async () => {
    if (!selectedClassId || !currentTerm) return;
    setLoading(true);
    try {
      const response = await api.get(`/timetables/class/${selectedClassId}?termId=${currentTerm.id}`);
      setPeriods(response.data);
    } catch (error) {
      console.error('Error fetching class timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherTimetable = async () => {
    if (!selectedTeacherId || !currentTerm) return;
    setLoading(true);
    try {
      const response = await api.get(`/timetables/teacher/${selectedTeacherId}?termId=${currentTerm.id}`);
      setPeriods(response.data);
    } catch (error) {
      console.error('Error fetching teacher timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTerm) return;

    try {
      await api.post('/timetables', {
        ...newPeriod,
        academicTermId: currentTerm.id,
        // If in class view, use selected class, otherwise use form value
        classId: viewMode === 'CLASS' ? selectedClassId : newPeriod.classId,
        // If in teacher view, use selected teacher, otherwise use form value
        teacherId: viewMode === 'TEACHER' ? selectedTeacherId : newPeriod.teacherId
      });
      
      setShowAddModal(false);
      // Refresh
      if (viewMode === 'CLASS') fetchClassTimetable();
      else fetchTeacherTimetable();
      
      // Reset form partially
      setNewPeriod(prev => ({ ...prev, startTime: prev.endTime, endTime: '' })); 
    } catch (error: any) {
      console.error('Error adding period:', error);
      alert(error.response?.data?.message || 'Failed to add period');
    }
  };

  const handleDeletePeriod = async (id: string) => {
    if (!confirm('Are you sure you want to delete this period?')) return;
    try {
      await api.delete(`/timetables/${id}`);
      if (viewMode === 'CLASS') fetchClassTimetable();
      else fetchTeacherTimetable();
    } catch (error) {
      console.error('Error deleting period:', error);
    }
  };

  const getPeriodsForDay = (day: string) => {
    return periods.filter(p => p.dayOfWeek === day);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" />
            Class Timetable
          </h1>
          <p className="text-gray-500">
            {currentTerm ? `${currentTerm.name} Schedule` : 'Loading term...'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setViewMode('CLASS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'CLASS' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Class View
            </button>
            <button
              onClick={() => setViewMode('TEACHER')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'TEACHER' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Teacher View
            </button>
          </div>

          {viewMode === 'CLASS' ? (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select Teacher</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </select>
          )}

          {(user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              disabled={!selectedClassId && !selectedTeacherId}
            >
              <Plus size={20} />
              Add Period
            </button>
          )}
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {DAYS.map(day => (
          <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 text-center">
              {day}
            </div>
            <div className="p-2 space-y-2 flex-1 min-h-[200px]">
              {getPeriodsForDay(day).length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                  No classes
                </div>
              ) : (
                getPeriodsForDay(day).map(period => (
                  <div key={period.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3 hover:shadow-md transition-shadow relative group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                        {period.startTime} - {period.endTime}
                      </span>
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER') && (
                        <button 
                          onClick={() => handleDeletePeriod(period.id)}
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm mb-1">{period.subject.name}</h4>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      {viewMode === 'CLASS' ? (
                        <>
                          <User size={12} />
                          {period.teacher?.fullName || 'No Teacher'}
                        </>
                      ) : (
                        <>
                          <Users size={12} />
                          {period.class?.name || 'No Class'}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Period Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Timetable Period</h2>
            <form onSubmit={handleAddPeriod} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={newPeriod.dayOfWeek}
                    onChange={(e) => setNewPeriod({ ...newPeriod, dayOfWeek: e.target.value })}
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={newPeriod.subjectId}
                    onChange={(e) => setNewPeriod({ ...newPeriod, subjectId: e.target.value })}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={newPeriod.startTime}
                    onChange={(e) => setNewPeriod({ ...newPeriod, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={newPeriod.endTime}
                    onChange={(e) => setNewPeriod({ ...newPeriod, endTime: e.target.value })}
                  />
                </div>
              </div>

              {viewMode === 'CLASS' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={newPeriod.teacherId}
                    onChange={(e) => setNewPeriod({ ...newPeriod, teacherId: e.target.value })}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={newPeriod.classId}
                    onChange={(e) => setNewPeriod({ ...newPeriod, classId: e.target.value })}
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
