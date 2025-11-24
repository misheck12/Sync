import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, PlayCircle } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface Assessment {
  id: string;
  title: string;
  type: string;
  date: string;
  subject: { name: string };
  durationMinutes?: number;
  isOnline: boolean;
  submission?: {
    status: 'SUBMITTED' | 'GRADED';
    score: number;
  };
}

const StudentAssessments = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      // We need an endpoint to get assessments for the logged-in student
      const response = await api.get('/online-assessments/student/my-assessments');
      setAssessments(response.data);
    } catch (error) {
      console.error('Failed to fetch assessments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeQuiz = (id: string) => {
    navigate(`/student/quiz/${id}`);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Assessments</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments.map(assessment => (
          <div key={assessment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                assessment.type === 'EXAM' ? 'bg-red-100 text-red-700' :
                assessment.type === 'QUIZ' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {assessment.type}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(assessment.date).toLocaleDateString()}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2">{assessment.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{assessment.subject.name}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              {assessment.durationMinutes && (
                <span className="flex items-center gap-1">
                  <Clock size={16} /> {assessment.durationMinutes}m
                </span>
              )}
            </div>

            {assessment.submission ? (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <CheckCircle size={18} />
                  Submitted
                </div>
                {assessment.submission.score !== null && (
                  <span className="font-bold text-gray-900">{assessment.submission.score} pts</span>
                )}
              </div>
            ) : assessment.isOnline ? (
              <button
                onClick={() => handleTakeQuiz(assessment.id)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <PlayCircle size={18} />
                Take Quiz
              </button>
            ) : (
              <div className="text-center text-gray-500 text-sm py-2 bg-gray-50 rounded-lg">
                In-class assessment
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentAssessments;
