import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, CalendarCheck, Settings, LogOut, BookOpen, GraduationCap, UserCog, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/', 
      roles: ['SUPER_ADMIN', 'BURSAR', 'TEACHER', 'SECRETARY'] 
    },
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
      roles: ['SUPER_ADMIN', 'BURSAR', 'TEACHER', 'SECRETARY', 'PARENT'] 
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
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-400">Sync</h1>
        <p className="text-xs text-slate-400">School Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
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
  );
};

export default Sidebar;
