import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Users, BookOpen, HelpCircle, Plus, Pin } from 'lucide-react';
import api from '../../services/api';

interface Forum {
  id: string;
  name: string;
  description?: string;
  type: string;
  isPinned: boolean;
  class?: { name: string };
  subject?: { name: string };
  createdBy: { fullName: string };
  _count: { topics: number };
}

const ForumList = () => {
  const navigate = useNavigate();
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'GENERAL',
    classId: '',
    subjectId: '',
  });

  useEffect(() => {
    fetchForums();
    fetchClasses();
    fetchSubjects();
    
    // Get user role from localStorage or context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
  }, []);

  const fetchForums = async () => {
    try {
      setLoading(true);
      const response = await api.get('/forums');
      setForums(response.data);
    } catch (error) {
      console.error('Failed to fetch forums:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const handleCreateForum = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/forums', formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        type: 'GENERAL',
        classId: '',
        subjectId: '',
      });
      fetchForums();
    } catch (error) {
      console.error('Failed to create forum:', error);
      alert('Failed to create forum');
    } finally {
      setLoading(false);
    }
  };

  const getForumIcon = (type: string) => {
    switch (type) {
      case 'GENERAL':
        return <MessageSquare className="w-6 h-6" />;
      case 'CLASS':
        return <Users className="w-6 h-6" />;
      case 'SUBJECT':
        return <BookOpen className="w-6 h-6" />;
      case 'QA':
        return <HelpCircle className="w-6 h-6" />;
      default:
        return <MessageSquare className="w-6 h-6" />;
    }
  };

  const getForumColor = (type: string) => {
    switch (type) {
      case 'GENERAL':
        return 'bg-blue-100 text-blue-600';
      case 'CLASS':
        return 'bg-green-100 text-green-600';
      case 'SUBJECT':
        return 'bg-purple-100 text-purple-600';
      case 'QA':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const canCreateForum = userRole === 'TEACHER' || userRole === 'SUPER_ADMIN';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discussion Forums</h1>
          <p className="text-slate-600 mt-1">Ask questions, share ideas, and learn together</p>
        </div>
        {canCreateForum && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Create Forum
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-slate-500">Total Forums</p>
          <p className="text-2xl font-bold text-slate-900">{forums.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-slate-500">Total Topics</p>
          <p className="text-2xl font-bold text-slate-900">
            {forums.reduce((acc, f) => acc + f._count.topics, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-slate-500">Q&A Forums</p>
          <p className="text-2xl font-bold text-slate-900">
            {forums.filter(f => f.type === 'QA').length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-slate-500">Subject Forums</p>
          <p className="text-2xl font-bold text-slate-900">
            {forums.filter(f => f.type === 'SUBJECT').length}
          </p>
        </div>
      </div>

      {/* Forums Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && forums.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading forums...</div>
        ) : forums.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            No forums yet. {canCreateForum && 'Create one to get started!'}
          </div>
        ) : (
          forums.map((forum) => (
            <div
              key={forum.id}
              onClick={() => navigate(`/forums/${forum.id}`)}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getForumColor(forum.type)}`}>
                  {getForumIcon(forum.type)}
                </div>
                {forum.isPinned && (
                  <Pin className="w-5 h-5 text-blue-600" />
                )}
              </div>

              <h3 className="font-semibold text-slate-900 mb-1">{forum.name}</h3>
              
              {forum.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{forum.description}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-slate-500">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs">{forum.type}</span>
                  {forum.class && (
                    <span className="text-xs">{forum.class.name}</span>
                  )}
                  {forum.subject && (
                    <span className="text-xs">{forum.subject.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <MessageSquare className="w-4 h-4" />
                  <span>{forum._count.topics}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Forum Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">Create New Forum</h2>
            </div>
            <form onSubmit={handleCreateForum} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Forum Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Grade 10 Mathematics Q&A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="What is this forum about?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Forum Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="GENERAL">General Discussion</option>
                  <option value="CLASS">Class Forum</option>
                  <option value="SUBJECT">Subject Forum</option>
                  <option value="QA">Q&A Forum</option>
                </select>
              </div>

              {(formData.type === 'CLASS' || formData.type === 'SUBJECT') && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.type === 'CLASS' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Class
                      </label>
                      <select
                        value={formData.classId}
                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.type === 'SUBJECT' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Subject
                      </label>
                      <select
                        value={formData.subjectId}
                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select subject</option>
                        {subjects.map((subj) => (
                          <option key={subj.id} value={subj.id}>
                            {subj.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Forum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumList;
