import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, MessageSquare, CheckCircle, Pin, Lock, Trash2 } from 'lucide-react';
import api from '../../services/api';

interface Post {
  id: string;
  content: string;
  isAnswer: boolean;
  likes: number;
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
    profilePictureUrl?: string;
    role: string;
  };
  replies: Post[];
  postLikes: any[];
}

interface Topic {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  isResolved: boolean;
  views: number;
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
    profilePictureUrl?: string;
    role: string;
  };
  forum: {
    id: string;
    name: string;
    class?: { name: string };
    subject?: { name: string };
  };
  posts: Post[];
}

const TopicView = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    fetchTopic();
    
    // Get user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
    setUserId(user.id || '');
  }, [topicId]);

  const fetchTopic = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/forums/topics/${topicId}`);
      setTopic(response.data);
    } catch (error) {
      console.error('Failed to fetch topic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent, parentPostId?: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setLoading(true);
      await api.post(`/forums/topics/${topicId}/posts`, {
        content: replyContent,
        parentPostId,
      });
      setReplyContent('');
      setReplyingTo(null);
      fetchTopic();
    } catch (error) {
      console.error('Failed to post reply:', error);
      alert('Failed to post reply');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await api.post(`/forums/posts/${postId}/like`);
      fetchTopic();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleMarkAnswer = async (postId: string) => {
    try {
      await api.post(`/forums/posts/${postId}/mark-answer`);
      fetchTopic();
    } catch (error) {
      console.error('Failed to mark answer:', error);
    }
  };

  const handleTogglePin = async () => {
    try {
      await api.post(`/forums/topics/${topicId}/pin`);
      fetchTopic();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleToggleLock = async () => {
    try {
      await api.post(`/forums/topics/${topicId}/lock`);
      fetchTopic();
    } catch (error) {
      console.error('Failed to toggle lock:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/forums/posts/${postId}`);
      fetchTopic();
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const canModerate = userRole === 'TEACHER' || userRole === 'SUPER_ADMIN';

  const renderPost = (post: Post, isReply: boolean = false) => {
    const isLiked = post.postLikes.length > 0;
    const canDelete = post.createdBy.id === userId || userRole === 'SUPER_ADMIN';

    return (
      <div key={post.id} className={`${isReply ? 'ml-12 mt-4' : ''}`}>
        <div className={`bg-white rounded-lg border p-4 ${post.isAnswer ? 'border-green-500 border-2' : ''}`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                {post.createdBy.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{post.createdBy.fullName}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                    {post.createdBy.role}
                  </span>
                  {post.isAnswer && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                      <CheckCircle className="w-3 h-3" />
                      Answer
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-500">{formatDate(post.createdAt)}</span>
              </div>
            </div>
            {canDelete && (
              <button
                onClick={() => handleDeletePost(post.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="text-slate-700 mb-4 whitespace-pre-wrap">{post.content}</div>

          {/* Actions */}
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center gap-1 ${isLiked ? 'text-blue-600' : 'text-slate-600'} hover:text-blue-600`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{post.likes}</span>
            </button>
            {!topic?.isLocked && (
              <button
                onClick={() => setReplyingTo(post.id)}
                className="flex items-center gap-1 text-slate-600 hover:text-blue-600"
              >
                <MessageSquare className="w-4 h-4" />
                Reply
              </button>
            )}
            {canModerate && !post.isAnswer && !isReply && (
              <button
                onClick={() => handleMarkAnswer(post.id)}
                className="flex items-center gap-1 text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Answer
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === post.id && (
            <form onSubmit={(e) => handleReply(e, post.id)} className="mt-4">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Write your reply..."
                required
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Nested Replies */}
        {post.replies && post.replies.length > 0 && (
          <div className="space-y-4">
            {post.replies.map(reply => renderPost(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (!topic) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-slate-500">Loading topic...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/forums/${topic.forum.id}`)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to {topic.forum.name}
        </button>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {topic.isPinned && <Pin className="w-5 h-5 text-blue-600" />}
                {topic.isLocked && <Lock className="w-5 h-5 text-slate-400" />}
                {topic.isResolved && <CheckCircle className="w-5 h-5 text-green-600" />}
                <h1 className="text-2xl font-bold text-slate-900">{topic.title}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    {topic.createdBy.fullName.charAt(0)}
                  </div>
                  <span>{topic.createdBy.fullName}</span>
                </div>
                <span>{formatDate(topic.createdAt)}</span>
                <span>{topic.views} views</span>
              </div>
            </div>
            {canModerate && (
              <div className="flex gap-2">
                <button
                  onClick={handleTogglePin}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50"
                >
                  {topic.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={handleToggleLock}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50"
                >
                  {topic.isLocked ? 'Unlock' : 'Lock'}
                </button>
              </div>
            )}
          </div>

          <div className="text-slate-700 whitespace-pre-wrap">{topic.content}</div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4 mb-6">
        {topic.posts.map(post => renderPost(post))}
      </div>

      {/* Reply Form */}
      {!topic.isLocked && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Post a Reply</h3>
          <form onSubmit={(e) => handleReply(e)}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Share your thoughts..."
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Reply'}
            </button>
          </form>
        </div>
      )}

      {topic.isLocked && (
        <div className="bg-slate-50 rounded-lg border p-6 text-center text-slate-600">
          <Lock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p>This topic is locked. No new replies can be posted.</p>
        </div>
      )}
    </div>
  );
};

export default TopicView;
