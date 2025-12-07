import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Video, Eye, Clock, Upload } from 'lucide-react';
import api from '../../utils/api';

interface VideoLesson {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  subject: {
    name: string;
  };
  class: {
    name: string;
  };
  _count: {
    progress: number;
  };
  createdAt: string;
}

const VideoLessons = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await api.get('/video-lessons/teacher/videos');
      setVideos(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Lessons</h1>
          <p className="text-gray-600 mt-1">Manage your recorded lessons and educational content</p>
        </div>
        <button
          onClick={() => navigate('/teacher/videos/upload')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Upload size={20} />
          Upload Video
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Video size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos yet</h3>
          <p className="text-gray-600 mb-6">Upload your first video lesson</p>
          <button
            onClick={() => navigate('/teacher/videos/upload')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upload Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-video bg-gray-200">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video size={48} className="text-gray-400" />
                  </div>
                )}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{video.subject.name}</span>
                  <span>{video.class.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Eye size={16} />
                    <span>{video._count.progress} views</span>
                  </div>
                  <button
                    onClick={() => navigate(`/student/video/${video.id}`)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoLessons;
