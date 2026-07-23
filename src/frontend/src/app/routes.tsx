import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { QrConfirm } from './pages/auth/QrConfirm';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Students } from './pages/admin/Students';
import { StudentDetail } from './pages/admin/StudentDetail';
import { Teachers } from './pages/admin/Teachers';
import { TeacherDetail } from './pages/admin/TeacherDetail';
import { Classes } from './pages/admin/Classes';
import { Enrollments } from './pages/admin/Enrollments';
import { Curriculum } from './pages/admin/Curriculum';
import { AdminProfile } from './pages/admin/AdminProfile';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherProfile } from './pages/teacher/TeacherProfile';
import { TeacherAdvisorClass } from './pages/teacher/TeacherAdvisorClass';
import { TeacherGrading } from './pages/teacher/TeacherGrading';
import { TeacherStudentDetail } from './pages/teacher/TeacherStudentDetail';
import { TeacherQuiz } from './pages/teacher/TeacherQuiz';
import { TeacherCourseContent } from './pages/teacher/TeacherCourseContent';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentQuizPlayer } from './pages/student/StudentQuizPlayer';
import { StudentCourse } from './pages/student/StudentCourse';
import { StudentCurriculum } from './pages/student/StudentCurriculum';
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
    path: '/auth/qr-confirm',
    element: <QrConfirm />
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
        path: 'curriculum',
        element: <Curriculum />
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
        element: <TeacherGrading />
      },
      {
        path: 'profile',
        element: <TeacherProfile />
      },
      {
        path: 'advisor',
        element: <TeacherAdvisorClass />
      },
      {
        path: 'advisor/students/:id',
        element: <TeacherStudentDetail />
      },
      {
        path: 'quiz/:classId',
        element: <TeacherQuiz />
      },
      {
        path: 'course/:classId',
        element: <TeacherCourseContent />
      },
      // Back-compat redirects from the old /teacher/students paths
      {
        path: 'students',
        element: <Navigate to="/teacher/advisor" replace />
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
      },
      {
        path: 'quiz/:quizId',
        element: <StudentQuizPlayer />
      },
      {
        path: 'course/:classId',
        element: <StudentCourse />
      },
      {
        path: 'curriculum',
        element: <StudentCurriculum />
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);
