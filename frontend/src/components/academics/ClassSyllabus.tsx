import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, FileText, Plus, Calendar } from 'lucide-react';
import api from '../../utils/api';

interface Topic {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt: string | null;
}

interface LessonPlan {
  id: string;
  weekStartDate: string;
  title: string;
  content: string;
  teacher: {
    fullName: string;
  };
}

interface ClassSyllabusProps {
  classId: string;
  subjectId: string;
}

const ClassSyllabus: React.FC<ClassSyllabusProps> = ({ classId, subjectId }) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'plans'>('progress');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  
  // New Plan Form
  const [newPlan, setNewPlan] = useState({
    weekStartDate: '',
    title: '',
    content: '',
    termId: '' // This needs to be fetched or passed
  });
  const [terms, setTerms] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (classId && subjectId) {
      if (activeTab === 'progress') fetchProgress();
      else fetchPlans();
    }
  }, [classId, subjectId, activeTab]);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const response = await api.get('/academic-terms');
      setTerms(response.data);
      const activeTerm = response.data.find((t: any) => t.isActive);
      if (activeTerm) {
        setNewPlan(prev => ({ ...prev, termId: activeTerm.id }));
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/syllabus/progress?classId=${classId}&subjectId=${subjectId}`);
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/syllabus/lesson-plans?classId=${classId}&subjectId=${subjectId}`);
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (topicId: string, newStatus: string) => {
    try {
      await api.put(`/syllabus/progress/${topicId}/${classId}`, { status: newStatus });
      fetchProgress();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/syllabus/lesson-plans', {
        ...newPlan,
        classId,
        subjectId,
        weekStartDate: new Date(newPlan.weekStartDate).toISOString()
      });
      setShowPlanModal(false);
      setNewPlan(prev => ({ ...prev, title: '', content: '' }));
      fetchPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Failed to create lesson plan');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 flex">
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'progress' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Curriculum Progress
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'plans' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Lesson Plans
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'progress' ? (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500">Loading progress...</div>
            ) : topics.length === 0 ? (
              <div className="text-center text-gray-500">No topics defined for this subject.</div>
            ) : (
              topics.map((topic) => (
                <div key={topic.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <h4 className="font-medium text-gray-900">{topic.title}</h4>
                    {topic.description && (
                      <p className="text-sm text-gray-500 mt-1">{topic.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusUpdate(topic.id, 'PENDING')}
                      className={`p-1.5 rounded-full transition-colors ${
                        topic.status === 'PENDING' ? 'bg-gray-200 text-gray-600' : 'text-gray-300 hover:bg-gray-100'
                      }`}
                      title="Pending"
                    >
                      <Circle size={20} />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(topic.id, 'IN_PROGRESS')}
                      className={`p-1.5 rounded-full transition-colors ${
                        topic.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' : 'text-gray-300 hover:bg-gray-100'
                      }`}
                      title="In Progress"
                    >
                      <Clock size={20} />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(topic.id, 'COMPLETED')}
                      className={`p-1.5 rounded-full transition-colors ${
                        topic.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'text-gray-300 hover:bg-gray-100'
                      }`}
                      title="Completed"
                    >
                      <CheckCircle size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowPlanModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Add Lesson Plan
              </button>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-gray-500">Loading plans...</div>
              ) : plans.length === 0 ? (
                <div className="text-center text-gray-500">No lesson plans found.</div>
              ) : (
                plans.map((plan) => (
                  <div key={plan.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">{plan.title}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar size={12} />
                          Week of {new Date(plan.weekStartDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {plan.teacher.fullName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{plan.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add Lesson Plan</h2>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Week Start Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={newPlan.weekStartDate}
                  onChange={(e) => setNewPlan({ ...newPlan, weekStartDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={newPlan.title}
                  onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                  placeholder="e.g. Week 3: Quadratic Equations"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                  value={newPlan.content}
                  onChange={(e) => setNewPlan({ ...newPlan, content: e.target.value })}
                  placeholder="Detail your lesson plan here..."
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSyllabus;
