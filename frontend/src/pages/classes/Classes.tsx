import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Plus, Search, Trash2, Edit2, BookOpen, Users, FileText, X } from 'lucide-react';
import ClassSyllabus from '../../components/academics/ClassSyllabus';

interface Subject { id: string; name: string; code: string; }
interface Class {
  id: string; name: string; gradeLevel: number; teacherId: string; academicTermId: string;
  subjects: Subject[]; teacher: { fullName: string }; _count: { students: number };
}
interface Student { id: string; firstName: string; lastName: string; admissionNumber: string; classId: string; }

const Classes = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [managingClass, setManagingClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [syllabusClass, setSyllabusClass] = useState<Class | null>(null);
  const [syllabusSubjectId, setSyllabusSubjectId] = useState<string>('');

  const [formData, setFormData] = useState({ name: '', gradeLevel: 1, teacherId: '', academicTermId: '', subjectIds: [] as string[] });
  const [teachers, setTeachers] = useState<{id: string, fullName: string}[]>([]);
  const [terms, setTerms] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetchClasses(); fetchSubjects(); fetchTeachers(); fetchTerms();
  }, []);

  const fetchClasses = async () => {
    try { const response = await api.get('/classes'); setClasses(response.data); }
    catch (error) { console.error('Failed to fetch classes', error); }
    finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try { const response = await api.get('/subjects'); setSubjects(response.data); }
    catch (error) { console.error('Failed to fetch subjects', error); }
  };

  const fetchTeachers = async () => {
    try { const response = await api.get('/users/teachers'); setTeachers(response.data); }
    catch (error) { console.error('Failed to fetch teachers', error); }
  };

  const fetchTerms = async () => {
    try { const response = await api.get('/academic-terms'); setTerms(response.data); }
    catch (error) { console.error('Failed to fetch terms', error); }
  };

  const fetchClassStudents = async (classId: string) => {
    try { const response = await api.get(`/classes/${classId}/students`); setClassStudents(response.data); }
    catch (error) { console.error('Failed to fetch class students', error); }
  };

  const fetchAllStudents = async () => {
    try { const response = await api.get('/students'); setAllStudents(response.data); }
    catch (error) { console.error('Failed to fetch all students', error); }
  };

  const openStudentModal = async (cls: Class) => {
    setManagingClass(cls);
    await fetchClassStudents(cls.id);
    await fetchAllStudents();
    setSelectedStudentIds([]);
    setShowStudentModal(true);
  };

  const openSyllabusModal = (cls: Class) => {
    setSyllabusClass(cls);
    setSyllabusSubjectId(cls.subjects.length > 0 ? cls.subjects[0].id : '');
    setShowSyllabusModal(true);
  };

  const handleAddStudents = async () => {
    if (!managingClass || selectedStudentIds.length === 0) return;
    try {
      await api.post(`/classes/${managingClass.id}/students`, { studentIds: selectedStudentIds });
      await fetchClassStudents(managingClass.id);
      await fetchClasses();
      setSelectedStudentIds([]);
      alert('Students added successfully');
    } catch (error) { console.error('Failed to add students', error); alert('Failed to add students'); }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, gradeLevel: Number(formData.gradeLevel) };
      if (editingClass) { await api.put(`/classes/${editingClass.id}`, payload); }
      else { await api.post('/classes', payload); }
      fetchClasses(); setShowModal(false); resetForm();
    } catch (error) { console.error('Failed to save class', error); alert('Failed to save class'); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try { await api.delete(`/classes/${id}`); fetchClasses(); }
      catch (error) { console.error('Failed to delete class', error); }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', gradeLevel: 1, teacherId: '', academicTermId: '', subjectIds: [] });
    setEditingClass(null);
  };

  const openEditModal = (cls: Class) => {
    setEditingClass(cls);
    setFormData({ name: cls.name, gradeLevel: cls.gradeLevel, teacherId: cls.teacherId, academicTermId: cls.academicTermId, subjectIds: cls.subjects.map(s => s.id) });
    setShowModal(true);
  };

  const toggleSubject = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId) ? prev.subjectIds.filter(id => id !== subjectId) : [...prev.subjectIds, subjectId]
    }));
  };

  const availableStudents = allStudents.filter(s => 
    s.classId !== managingClass?.id && 
    (s.firstName.toLowerCase().includes(studentSearchTerm.toLowerCase()) || 
     s.lastName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
     s.admissionNumber.includes(studentSearchTerm))
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Class Sections</h1>
          <p className="text-sm text-gray-500">Manage classes and student assignments</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto">
          <Plus size={20} />
          <span>Add Class</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><p className="text-gray-500">Loading classes...</p></div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-400 mb-2">No classes defined. Create one to start adding students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">{cls.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Grade {cls.gradeLevel} • {cls._count.students} Students</p>
                </div>
                <div className="flex space-x-1 sm:space-x-2">
                  <button onClick={() => openSyllabusModal(cls)} className="text-gray-400 hover:text-purple-600 p-1" title="Syllabus"><FileText size={16} /></button>
                  <button onClick={() => openStudentModal(cls)} className="text-gray-400 hover:text-green-600 p-1" title="Students"><Users size={16} /></button>
                  <button onClick={() => openEditModal(cls)} className="text-gray-400 hover:text-blue-600 p-1" title="Edit"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(cls.id)} className="text-gray-400 hover:text-red-600 p-1" title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              
              <div className="mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-2 flex items-center">
                  <BookOpen size={14} className="mr-1" />
                  Subjects ({cls.subjects.length})
                </p>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {cls.subjects.slice(0, 4).map(subject => (
                    <span key={subject.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md font-medium border border-blue-100">
                      {subject.name}
                    </span>
                  ))}
                  {cls.subjects.length > 4 && <span className="text-xs text-gray-400">+{cls.subjects.length - 4} more</span>}
                  {cls.subjects.length === 0 && <span className="text-xs text-gray-400 italic">No subjects</span>}
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-gray-100 flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-500">Teacher:</span>
                <span className="font-medium text-gray-900 truncate ml-2">{cls.teacher?.fullName || 'Unassigned'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Syllabus Modal */}
      {showSyllabusModal && syllabusClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Syllabus & Lesson Plans</h2>
                <p className="text-gray-500 text-xs sm:text-sm">{syllabusClass.name}</p>
              </div>
              <button onClick={() => setShowSyllabusModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={24} /></button>
            </div>
            <div className="mb-4">
              <select value={syllabusSubjectId} onChange={(e) => setSyllabusSubjectId(e.target.value)}
                className="w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm">
                {syllabusClass.subjects.length === 0 && <option value="">No subjects assigned</option>}
                {syllabusClass.subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto">
              {syllabusSubjectId ? <ClassSyllabus classId={syllabusClass.id} subjectId={syllabusSubjectId} /> :
                <div className="text-center py-12 text-gray-500">Select a subject to view syllabus.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Student Management Modal */}
      {showStudentModal && managingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-4xl h-[95vh] sm:h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Manage Students</h2>
                <p className="text-gray-500 text-xs sm:text-sm">{managingClass.name}</p>
              </div>
              <button onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={24} /></button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
              {/* Current Students */}
              <div className="flex flex-col border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-2 sm:p-3 border-b font-medium text-gray-700 text-sm">Current ({classStudents.length})</div>
                <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2">
                  {classStudents.length === 0 ? <p className="text-gray-400 text-center py-4 text-sm">No students</p> :
                    classStudents.map(student => (
                      <div key={student.id} className="flex justify-between items-center p-2 bg-white border rounded text-sm">
                        <div>
                          <p className="font-medium">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-gray-500">{student.admissionNumber}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Add Students */}
              <div className="flex flex-col border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-2 sm:p-3 border-b font-medium text-gray-700 flex justify-between items-center text-sm">
                  <span>Add Students</span>
                  <button onClick={handleAddStudents} disabled={selectedStudentIds.length === 0}
                    className={`text-xs px-2 sm:px-3 py-1 rounded ${selectedStudentIds.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    Add ({selectedStudentIds.length})
                  </button>
                </div>
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search..." value={studentSearchTerm} onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2">
                  {availableStudents.length === 0 ? <p className="text-gray-400 text-center py-4 text-sm">No students found</p> :
                    availableStudents.map(student => (
                      <label key={student.id} className="flex items-center space-x-2 p-2 bg-white border rounded hover:bg-gray-50 cursor-pointer text-sm">
                        <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleStudentSelection(student.id)}
                          className="rounded text-blue-600 focus:ring-blue-500" />
                        <div>
                          <p className="font-medium">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-gray-500">{student.admissionNumber}</p>
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">{editingClass ? 'Edit Class' : 'Add Class'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g. Grade 10A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                  <input type="number" required min="1" max="12" value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                  <select required value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-sm">
                    <option value="">Select teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Term</label>
                  <select required value={formData.academicTermId} onChange={(e) => setFormData({ ...formData, academicTermId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-sm">
                    <option value="">Select term</option>
                    {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Subjects</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {subjects.map(subject => (
                    <label key={subject.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.subjectIds.includes(subject.id)} onChange={() => toggleSubject(subject.id)}
                        className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-gray-700 truncate">{subject.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  {editingClass ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
