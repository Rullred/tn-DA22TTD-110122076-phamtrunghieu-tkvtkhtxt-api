import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Students } from './pages/admin/Students';
import { StudentDetail } from './pages/admin/StudentDetail';
import { Teachers } from './pages/admin/Teachers';
import { TeacherDetail } from './pages/admin/TeacherDetail';
import { Classes } from './pages/admin/Classes';
import { Enrollments } from './pages/admin/Enrollments';
import { AdminProfile } from './pages/admin/AdminProfile';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherProfile } from './pages/teacher/TeacherProfile';
import { TeacherStudents } from './pages/teacher/TeacherStudents';
import { TeacherStudentDetail } from './pages/teacher/TeacherStudentDetail';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />
      },
      {
        path: 'students',
        element: <Students />
      },
      {
        path: 'students/:id',
        element: <StudentDetail />
      },
      {
        path: 'teachers',
        element: <Teachers />
      },
      {
        path: 'teachers/:id',
        element: <TeacherDetail />
      },
      {
        path: 'classes',
        element: <Classes />
      },
      {
        path: 'enrollments',
        element: <Enrollments />
      },
      {
        path: 'profile',
        element: <AdminProfile />
      }
    ]
  },
  {
    path: '/teacher',
    element: (
      <ProtectedRoute allowedRoles={['teacher']}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <TeacherDashboard />
      },
      {
        path: 'classes',
        element: <TeacherDashboard />
      },
      {
        path: 'profile',
        element: <TeacherProfile />
      },
      {
        path: 'students',
        element: <TeacherStudents />
      },
      {
        path: 'students/:id',
        element: <TeacherStudentDetail />
      }
    ]
  },
  {
    path: '/student',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <StudentDashboard />
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);
