import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, MessageSquare, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  onMenuClick: () => void;
}

const BottomNav = ({ onMenuClick }: BottomNavProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Home', 
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
      icon: MessageSquare, 
      label: 'Chat', 
      path: '/communication', 
      roles: ['SUPER_ADMIN', 'BURSAR', 'TEACHER', 'SECRETARY', 'PARENT'] 
    },
  ];

  const filteredItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-between items-center z-40">
      {filteredItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.label}
            to={item.path}
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <item.icon size={24} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
      <button
        onClick={onMenuClick}
        className="flex flex-col items-center space-y-1 p-2 text-gray-500 rounded-lg"
      >
        <Menu size={24} />
        <span className="text-xs font-medium">Menu</span>
      </button>
    </div>
  );
};

export default BottomNav;
