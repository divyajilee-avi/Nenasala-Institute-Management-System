/**
 * App Router — Nenasala IMS
 * Role-based routing: admin / teacher / student
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public pages
import PublicLayout  from './components/layout/PublicLayout';
import HomePage      from './pages/public/HomePage';
import AboutPage     from './pages/public/AboutPage';
import ContactPage   from './pages/public/ContactPage';

// Auth
import LoginPage          from './pages/LoginPage';
import AdminLayout        from './pages/admin/AdminLayout';
import AdminDashboard     from './pages/admin/Dashboard';
import StudentsPage       from './pages/admin/StudentsPage';
import TeachersPage       from './pages/admin/TeachersPage';
import CoursesPage        from './pages/admin/CoursesPage';
import ClassesPage        from './pages/admin/ClassesPage';
import AttendancePage     from './pages/admin/AttendancePage';
import FeesPage           from './pages/admin/FeesPage';
import ExamsPage          from './pages/admin/ExamsPage';
import NoticesPage        from './pages/admin/NoticesPage';
import UsersPage          from './pages/admin/UsersPage';
import ReportsPage        from './pages/admin/ReportsPage';

import TeacherLayout      from './pages/teacher/TeacherLayout';
import TeacherDashboard   from './pages/teacher/Dashboard';
import TeacherClasses     from './pages/teacher/ClassesPage';
import TeacherAttendance  from './pages/teacher/AttendancePage';
import TeacherResults     from './pages/teacher/ResultsPage';
import TeacherNotices     from './pages/teacher/NoticesPage';
import TeacherMaterials   from './pages/teacher/MaterialsPage';

import StudentLayout      from './pages/student/StudentLayout';
import StudentDashboard   from './pages/student/Dashboard';
import StudentProfile     from './pages/student/ProfilePage';
import StudentTimetable   from './pages/student/TimetablePage';
import StudentAttendance  from './pages/student/AttendancePage';
import StudentResults     from './pages/student/ResultsPage';
import StudentFees        from './pages/student/FeesPage';
import StudentNotices     from './pages/student/NoticesPage';
import StudentMaterials   from './pages/student/MaterialsPage';
import QRScanPage         from './pages/student/QRScanPage';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"/></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/"        element={<HomePage />} />
            <Route path="/about"   element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />

          {/* Admin routes */}
          <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminLayout /></PrivateRoute>}>
            <Route index        element={<AdminDashboard />} />
            <Route path="students"  element={<StudentsPage />} />
            <Route path="teachers"  element={<TeachersPage />} />
            <Route path="courses"   element={<CoursesPage />} />
            <Route path="classes"   element={<ClassesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="fees"      element={<FeesPage />} />
            <Route path="exams"     element={<ExamsPage />} />
            <Route path="notices"   element={<NoticesPage />} />
            <Route path="users"     element={<UsersPage />} />
            <Route path="reports"   element={<ReportsPage />} />
          </Route>

          {/* Teacher routes */}
          <Route path="/teacher" element={<PrivateRoute roles={['teacher']}><TeacherLayout /></PrivateRoute>}>
            <Route index           element={<TeacherDashboard />} />
            <Route path="classes"  element={<TeacherClasses />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="results"  element={<TeacherResults />} />
            <Route path="notices"  element={<TeacherNotices />} />
            <Route path="materials" element={<TeacherMaterials />} />
          </Route>

          {/* Student routes */}
          <Route path="/student" element={<PrivateRoute roles={['student']}><StudentLayout /></PrivateRoute>}>
            <Route index             element={<StudentDashboard />} />
            <Route path="profile"    element={<StudentProfile />} />
            <Route path="timetable"  element={<StudentTimetable />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="results"    element={<StudentResults />} />
            <Route path="fees"       element={<StudentFees />} />
            <Route path="notices"    element={<StudentNotices />} />
            <Route path="materials"  element={<StudentMaterials />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  const map = { admin:'admin', teacher:'teacher', student:'student', receptionist:'admin' };
  return <Navigate to={`/${map[user.role] ?? 'login'}`} replace />;
}
