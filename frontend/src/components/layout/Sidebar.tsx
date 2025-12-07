import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, CalendarCheck, Settings, LogOut, BookOpen, GraduationCap, UserCog, MessageSquare, X, Video, Mic, Calendar, PlayCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/', 
      roles: ['SUPER_ADMIN', 'BURSAR', 'TEACHER', 'SECRETARY', 'STUDENT'] 
    },
    // Student-specific menu items
    { 
      icon: Calendar, 
      label: 'My Classes', 
      path: '/student/class-schedule', 
      roles: ['STUDENT'] 
    },
    { 
      icon: Video, 
      label: 'Video Library', 
      path: '/student/video-library', 
      roles: ['STUDENT'] 
    },
    { 
      icon: Mic, 
      label: 'AI Tutor', 
      path: '/student/voice-tutor', 
      roles: ['STUDENT'] 
    },
    { 
      icon: BookOpen, 
      label: 'Assessments', 
      path: '/student/assessments', 
      roles: ['STUDENT'] 
    },
    // Admin/Teacher menu items
    { 
      icon: Users, 
      label: 'Students', 
      path: '/students', 
      roles: ['SUPER_ADMIN', 'BURSAR', 'TEACHER', 'SECRETARY'] 
    },
    { 
      icon: BookOpen, 
      label: 'Academics', 
      path: '/academics', 
      roles: ['SUPER_ADMIN', 'TEACHER'] 
    },
    { 
      icon: PlayCircle, 
      label: 'Live Classes', 
      path: '/teacher/live-classes', 
      roles: ['SUPER_ADMIN', 'TEACHER'] 
    },
    { 
      icon: Video, 
      label: 'Video Lessons', 
      path: '/teacher/videos', 
      roles: ['SUPER_ADMIN', 'TEACHER'] 
    },
    { 
      icon: CreditCard, 
      label: 'Finance', 
      path: '/finance', 
      roles: ['SUPER_ADMIN', 'BURSAR'] 
    },
    { 
      icon: CalendarCheck, 
      label: 'Attendance', 
      path: '/attendance', 
      roles: ['SUPER_ADMIN', 'TEACHER', 'SECRETARY'] 
    },
    { 
      icon: UserCog, 
      label: 'Users', 
      path: '/users', 
      roles: ['SUPER_ADMIN'] 
    },
    { 
      icon: MessageSquare, 
      label: 'Communication', 
      path: '/communication', 
      roles: ['SUPER_ADMIN', 'BURSAR', 'TEACHER', 'SECRETARY', 'PARENT', 'STUDENT'] 
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      path: '/settings', 
      roles: ['SUPER_ADMIN'] 
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Sync</h1>
            <p className="text-xs text-slate-400">School Management</p>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Student Section */}
          {user?.role === 'STUDENT' && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">
                Learning
              </p>
            </div>
          )}

          {/* Teacher Section */}
          {(user?.role === 'TEACHER' || user?.role === 'SUPER_ADMIN') && filteredMenuItems.some(item => item.path.includes('/teacher/')) && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">
                Teaching
              </p>
            </div>
          )}

          {filteredMenuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const prevItem = filteredMenuItems[index - 1];
            
            // Add section divider
            const showDivider = prevItem && (
              (prevItem.roles.includes('STUDENT') && !item.roles.includes('STUDENT')) ||
              (prevItem.path.includes('/student/') && !item.path.includes('/student/') && !item.path.includes('/teacher/')) ||
              (prevItem.path.includes('/teacher/') && !item.path.includes('/teacher/'))
            );

            return (
              <React.Fragment key={item.label}>
                {showDivider && (
                  <div className="my-4 border-t border-slate-800" />
                )}
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
