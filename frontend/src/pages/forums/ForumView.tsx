import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MessageSquare, Eye, CheckCircle, Lock, Pin } from 'lucide-react';
import api from '../../services/api';

interface Topic {
  id: string;
  title: string;
  isPinned: boolean;
  isLocked: boolean;
  isResolved: boolean;
  views: number;
  createdAt: string;
  createdBy: {
    fullName: string;
    profilePictureUrl?: string;
  };
  _count: {
    posts: number;
  };
}

interface Forum {
  id: string;
  name: string;
  description?: string;
  type: string;
  class?: { name: string };
  subject?: { name: string };
  topics: Topic[];
}

const ForumView = () => {
  const { forumId } = useParams();
  const navigate = useNavigate();
  const [forum, setForum] = useState<Forum | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchForum();
  }, [forumId]);

  const fetchForum = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/forums/${forumId}`);
      setForum(response.data);
    } catch (error) {
      console.error('Failed to fetch forum:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post(`/forums/${forumId}/topics`, formData);
      setShowCreateModal(false);
      setFormData({ title: '', content: '' });
      fetchForum();
    } catch (error) {
      console.error('Failed to create topic:', error);
      alert('Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  if (!forum) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-slate-500">Loading forum...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/forums')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Forums
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{forum.name}</h1>
            {forum.description && (
              <p className="text-slate-600 mt-1">{forum.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
              <span className="px-2 py-1 bg-slate-100 rounded">{forum.type}</span>
              {forum.class && <span>{forum.class.name}</span>}
              {forum.subject && <span>{forum.subject.name}</span>}
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New Topic
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-slate-500">Total Topics</p>
          <p className="text-2xl font-bold text-slate-900">{forum.topics.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-slate-500">Total Replies</p>
          <p className="text-2xl font-bold text-slate-900">
            {forum.topics.reduce((acc, t) => acc + t._count.posts, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-sm text-slate-500">Resolved</p>
          <p className="text-2xl font-bold text-slate-900">
            {forum.topics.filter(t => t.isResolved).length}
          </p>
        </div>
      </div>

      {/* Topics List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-slate-900">Topics</h2>
        </div>
        <div className="divide-y">
          {loading && forum.topics.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Loading topics...</div>
          ) : forum.topics.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No topics yet. Be the first to start a discussion!
            </div>
          ) : (
            forum.topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => navigate(`/forums/topics/${topic.id}`)}
                className="p-4 hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                    {topic.createdBy.fullName.charAt(0)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {topic.isPinned && (
                        <Pin className="w-4 h-4 text-blue-600" />
                      )}
                      <h3 className="font-semibold text-slate-900 truncate">
                        {topic.title}
                      </h3>
                      {topic.isResolved && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {topic.isLocked && (
                        <Lock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{topic.createdBy.fullName}</span>
                      <span>{formatDate(topic.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{topic._count.posts} replies</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{topic.views} views</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Topic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900">Create New Topic</h2>
            </div>
            <form onSubmit={handleCreateTopic} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Topic Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., How do I solve quadratic equations?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder="Provide details about your question or topic..."
                  required
                />
              </div>

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
                  {loading ? 'Creating...' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumView;
