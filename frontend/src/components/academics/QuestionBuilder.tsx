import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface Question {
  id?: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  points: number;
  options?: QuestionOption[];
  correctAnswer?: string;
}

interface QuestionBuilderProps {
  assessmentId: string;
  onClose: () => void;
}

const QuestionBuilder: React.FC<QuestionBuilderProps> = ({ assessmentId, onClose }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Question State
  const [newQuestion, setNewQuestion] = useState<Question>({
    text: '',
    type: 'MULTIPLE_CHOICE',
    points: 1,
    options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }]
  });

  useEffect(() => {
    fetchQuestions();
  }, [assessmentId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/online-assessments/${assessmentId}/questions`);
      setQuestions(response.data);
    } catch (error) {
      console.error('Failed to fetch questions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    if (newQuestion.options) {
      setNewQuestion({
        ...newQuestion,
        options: [...newQuestion.options, { text: '', isCorrect: false }]
      });
    }
  };

  const handleOptionChange = (index: number, field: 'text' | 'isCorrect', value: any) => {
    if (!newQuestion.options) return;
    
    const updatedOptions = [...newQuestion.options];
    if (field === 'isCorrect') {
      // If single choice, uncheck others
      updatedOptions.forEach(opt => opt.isCorrect = false);
      updatedOptions[index].isCorrect = value;
    } else {
      updatedOptions[index].text = value;
    }
    
    setNewQuestion({ ...newQuestion, options: updatedOptions });
  };

  const handleRemoveOption = (index: number) => {
    if (!newQuestion.options) return;
    const updatedOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion({ ...newQuestion, options: updatedOptions });
  };

  const handleAddQuestion = () => {
    if (!newQuestion.text) return;
    
    setQuestions([...questions, newQuestion]);
    
    // Reset form
    setNewQuestion({
      text: '',
      type: 'MULTIPLE_CHOICE',
      points: 1,
      options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }]
    });
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      // Only save new questions (those without ID)
      // Ideally we should handle updates too, but for now let's just push all as new or handle bulk replace
      // The backend endpoint adds questions.
      
      // Filter out questions that already have an ID (assuming they are saved)
      // Actually the backend adds questions, so we should only send the new ones.
      // But the UI state here mixes fetched and new.
      // Let's just send the ones that don't have an ID.
      
      const questionsToSave = questions.filter(q => !q.id);
      
      if (questionsToSave.length === 0) {
        alert('No new questions to save');
        return;
      }

      await api.post(`/online-assessments/${assessmentId}/questions`, {
        questions: questionsToSave
      });
      
      alert('Questions saved successfully');
      fetchQuestions(); // Refresh
    } catch (error) {
      console.error('Failed to save questions', error);
      alert('Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Question Builder</h2>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Close
          </button>
          <button 
            onClick={handleSaveAll} 
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Questions'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Question Form */}
        <div className="space-y-6 border-r border-gray-200 pr-6">
          <h3 className="font-semibold text-gray-700">Add New Question</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
            <textarea
              value={newQuestion.text}
              onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              placeholder="Enter question text..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newQuestion.type}
                onChange={e => setNewQuestion({ ...newQuestion, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TRUE_FALSE">True/False</option>
                <option value="SHORT_ANSWER">Short Answer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
              <input
                type="number"
                min="1"
                value={newQuestion.points}
                onChange={e => setNewQuestion({ ...newQuestion, points: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Options for Multiple Choice */}
          {newQuestion.type === 'MULTIPLE_CHOICE' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Options</label>
              {newQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={option.isCorrect}
                    onChange={() => handleOptionChange(index, 'isCorrect', true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={e => handleOptionChange(index, 'text', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={`Option ${index + 1}`}
                  />
                  <button 
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddOption}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus size={16} /> Add Option
              </button>
            </div>
          )}

          {/* Options for True/False */}
          {newQuestion.type === 'TRUE_FALSE' && (
             <div className="space-y-3">
             <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
             <div className="flex gap-4">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input
                   type="radio"
                   name="tfCorrect"
                   checked={newQuestion.options?.[0]?.isCorrect}
                   onChange={() => {
                     setNewQuestion({
                       ...newQuestion,
                       options: [
                         { text: 'True', isCorrect: true },
                         { text: 'False', isCorrect: false }
                       ]
                     });
                   }}
                   className="w-4 h-4 text-blue-600"
                 />
                 <span>True</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input
                   type="radio"
                   name="tfCorrect"
                   checked={newQuestion.options?.[1]?.isCorrect}
                   onChange={() => {
                     setNewQuestion({
                       ...newQuestion,
                       options: [
                         { text: 'True', isCorrect: false },
                         { text: 'False', isCorrect: true }
                       ]
                     });
                   }}
                   className="w-4 h-4 text-blue-600"
                 />
                 <span>False</span>
               </label>
             </div>
           </div>
          )}

          <button
            onClick={handleAddQuestion}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add Question to List
          </button>
        </div>

        {/* Right: Question List */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          <h3 className="font-semibold text-gray-700">Questions ({questions.length})</h3>
          {questions.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              No questions added yet.
            </div>
          )}
          {questions.map((q, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-gray-900">Q{i + 1}. {q.text}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{q.type}</span>
              </div>
              
              {q.type === 'MULTIPLE_CHOICE' && (
                <ul className="space-y-1 ml-4 mt-2">
                  {q.options?.map((opt, j) => (
                    <li key={j} className={`text-sm flex items-center gap-2 ${opt.isCorrect ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                      {opt.isCorrect ? <CheckCircle size={14} /> : <div className="w-3.5" />}
                      {opt.text}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-2 text-xs text-gray-500 text-right">
                {q.points} points
              </div>
              
              {!q.id && (
                <button 
                  onClick={() => {
                    const newQs = questions.filter((_, idx) => idx !== i);
                    setQuestions(newQs);
                  }}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionBuilder;
