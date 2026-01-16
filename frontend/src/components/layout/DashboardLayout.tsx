import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import api from '../../utils/api';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
}

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const location = useLocation();

  React.useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/dashboard/announcements');
        setAnnouncements(res.data);
      } catch (error) {
        console.error('Failed to fetch announcements', error);
      }
    };
    fetchAnnouncements();
  }, []);

  const dismiss = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <Header />
      <main className="md:pl-64 min-h-screen transition-all duration-300 pt-header-safe pb-nav-safe md:pb-0">


        {/* Announcements */}
        <div className="px-4 pt-4 md:px-6 md:pt-6 space-y-2">
          {announcements.map(ann => (
            <div key={ann.id} className={`p-4 rounded-lg flex items-start justify-between shadow-sm ${ann.type === 'WARNING' ? 'bg-orange-50 text-orange-800 border-l-4 border-orange-500' :
              ann.type === 'ERROR' ? 'bg-red-50 text-red-800 border-l-4 border-red-500' :
                ann.type === 'SUCCESS' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' :
                  'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
              }`}>
              <div className="flex gap-3">
                {ann.type === 'WARNING' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> :
                  ann.type === 'ERROR' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> :
                    ann.type === 'SUCCESS' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> :
                      <Info className="w-5 h-5 flex-shrink-0" />}
                <div>
                  <h4 className="font-bold text-sm">{ann.title}</h4>
                  <p className="text-sm mt-0.5">{ann.message}</p>
                </div>
              </div>
              <button onClick={() => dismiss(ann.id)} className="text-current opacity-60 hover:opacity-100">
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <BottomNav onMenuClick={() => setIsMobileMenuOpen(true)} />
    </div>
  );
};

export default DashboardLayout;
