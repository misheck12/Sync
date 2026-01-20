import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Bell, AlertCircle, Calendar, Users, Filter } from 'lucide-react';
import api from '../../services/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  createdAt: string;
  publishAt?: string;
  expiresAt?: string;
  createdBy: {
    fullName: string;
  };
  isRead: boolean;
  readAt?: string;
}

const AnnouncementList = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    fetchAnnouncements();
    fetchUnreadCount();
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
  }, [filterCategory, filterPriority, showUnreadOnly]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterPriority) params.append('priority', filterPriority);
      if (showUnreadOnly) params.append('unreadOnly', 'true');

      const response = await api.get(`/announcements?${params}`);
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/announcements/unread-count');
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'EXAM':
        return '📝';
      case 'EVENT':
        return '🎉';
      case 'HOLIDAY':
        return '🏖️';
      case 'EMERGENCY':
        return '🚨';
      case 'ACADEMIC':
        return '📚';
      case 'ADMINISTRATIVE':
        return '📋';
      default:
        return '📢';
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const canCreateAnnouncement = ['TEACHER', 'SUPER_ADMIN', 'SECRETARY'].includes(userRole);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-slate-600 mt-1">Stay updated with school news and events</p>
        </div>
        {canCreateAnnouncement && (
          <button
            onClick={() => navigate('/announcements/create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New Announcement
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filters:</span>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="GENERAL">General</option>
            <option value="EXAM">Exam</option>
            <option value="EVENT">Event</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="ACADEMIC">Academic</option>
            <option value="ADMINISTRATIVE">Administrative</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-700">Unread only</span>
          </label>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading && announcements.length === 0 ? (
          <div className="text-center py-12 text-slate-500">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No announcements found.
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              onClick={() => navigate(`/announcements/${announcement.id}`)}
              className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer ${
                !announcement.isRead ? 'border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-3xl flex-shrink-0">
                  {getCategoryIcon(announcement.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
                        {!announcement.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{announcement.content}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                      {announcement.category}
                    </span>
                    <span>{announcement.createdBy.fullName}</span>
                    <span>{formatDate(announcement.createdAt)}</span>
                    {announcement.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Expires {formatDate(announcement.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementList;
