import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Students from './pages/students/Students';
import StudentProfile from './pages/students/StudentProfile';
import Finance from './pages/finance/Finance';
import Attendance from './pages/attendance/Attendance';
import Academics from './pages/academics/Academics';
import GradingScales from './pages/academics/GradingScales';
import ReportCards from './pages/academics/ReportCards';
import Timetable from './pages/academics/Timetable';
import Subjects from './pages/subjects/Subjects';
import Classes from './pages/classes/Classes';
import Users from './pages/users/Users';
import Settings from './pages/settings/Settings';
import Profile from './pages/profile/Profile';
import Communication from './pages/communication/Communication';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleGuard from './components/layout/RoleGuard';

import StudentQuiz from './pages/student/StudentQuiz';
import StudentAssessments from './pages/student/StudentAssessments';
import VoiceTutor from './pages/student/VoiceTutor';
import ClassSchedule from './pages/student/ClassSchedule';
import VideoLibrary from './pages/student/VideoLibrary';
import VideoPlayer from './pages/student/VideoPlayer';
import LiveClassroom from './pages/student/LiveClassroom';
import LiveClasses from './pages/teacher/LiveClasses';
import VideoLessons from './pages/teacher/VideoLessons';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/student/quiz/:assessmentId" element={<StudentQuiz />} />
            <Route path="/student/live-class/:sessionId" element={<LiveClassroom />} />
            
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/student/assessments" element={
                <RoleGuard allowedRoles={['STUDENT', 'SUPER_ADMIN']}>
                  <StudentAssessments />
                </RoleGuard>
              } />
              <Route path="/student/voice-tutor" element={
                <RoleGuard allowedRoles={['STUDENT', 'SUPER_ADMIN']}>
                  <VoiceTutor />
                </RoleGuard>
              } />
              <Route path="/student/class-schedule" element={
                <RoleGuard allowedRoles={['STUDENT', 'SUPER_ADMIN']}>
                  <ClassSchedule />
                </RoleGuard>
              } />
              <Route path="/student/video-library" element={
                <RoleGuard allowedRoles={['STUDENT', 'SUPER_ADMIN']}>
                  <VideoLibrary />
                </RoleGuard>
              } />
              <Route path="/student/video/:videoId" element={
                <RoleGuard allowedRoles={['STUDENT', 'SUPER_ADMIN']}>
                  <VideoPlayer />
                </RoleGuard>
              } />
              
              <Route path="/students" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'BURSAR', 'TEACHER', 'SECRETARY']}>
                  <Students />
                </RoleGuard>
              } />
              <Route path="/students/:id" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'BURSAR', 'TEACHER', 'SECRETARY']}>
                  <StudentProfile />
                </RoleGuard>
              } />
              
              <Route path="/finance" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'BURSAR']}>
                  <Finance />
                </RoleGuard>
              } />
              
              <Route path="/attendance" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'TEACHER', 'SECRETARY']}>
                  <Attendance />
                </RoleGuard>
              } />
              
              <Route path="/academics" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'TEACHER']}>
                  <Academics />
                </RoleGuard>
              } />
              <Route path="/academics/grading-scales" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'TEACHER']}>
                  <GradingScales />
                </RoleGuard>
              } />
              <Route path="/academics/report-cards" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'TEACHER']}>
                  <ReportCards />
                </RoleGuard>
              } />
              <Route path="/academics/timetable" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']}>
                  <Timetable />
                </RoleGuard>
              } />
              <Route path="/subjects" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'TEACHER']}>
                  <Subjects />
                </RoleGuard>
              } />
              <Route path="/classes" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'TEACHER', 'SECRETARY']}>
                  <Classes />
                </RoleGuard>
              } />
              
              <Route path="/users" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                  <Users />
                </RoleGuard>
              } />

              <Route path="/communication" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'BURSAR', 'TEACHER', 'SECRETARY', 'PARENT']}>
                  <Communication />
                </RoleGuard>
              } />

              <Route path="/teacher/live-classes" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'TEACHER']}>
                  <LiveClasses />
                </RoleGuard>
              } />
              <Route path="/teacher/videos" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'TEACHER']}>
                  <VideoLessons />
                </RoleGuard>
              } />

              <Route path="/settings" element={
                <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                  <Settings />
                </RoleGuard>
              } />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
