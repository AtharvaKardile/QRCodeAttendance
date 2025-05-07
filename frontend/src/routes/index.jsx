// ========================================================================
// qr-attendance-frontend/src/routes/index.jsx
// ========================================================================
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';

// --- Page Components ---

// Auth Pages
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';

// Student Pages
import StudentDashboardPage from '../pages/Student/StudentDashboardPage';
import StudentAttendancePage from '../pages/Student/ StudentAttendancePage';

// Teacher Pages
import TeacherDashboardPage from '../pages/Teacher/TeacherDashboardPage';
import TeacherStudentsPage from '../pages/Teacher/TeacherStudentsPage';
import TeacherCoursesPage from '../pages/Teacher/TeacherCoursesPage';
import TeacherTimetablePage from '../pages/Teacher/TeacherTimetablePage';
import TeacherQRCodeGeneratorPage from '../pages/Teacher/TeacherQRCodeGeneratorPage';

// Common Pages
import NotFoundPage from '../pages/Common/NotFoundPage';
import UnauthorizedPage from '../pages/Common/UnauthorizedPage'; // Optional

// --- Role Constants --- (Consider moving to utils/constants.js)
const ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
}

const AppRoutes = () => {
    return (
        <Routes>
            {/* Authentication Routes */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Main Application Routes (Protected) */}
            <Route element={<MainLayout />}>
                {/* Student Routes */}
                <Route
                    path="/student"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                            <StudentDashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/student/attendance"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                            <StudentAttendancePage />
                        </ProtectedRoute>
                    }
                />

                {/* Teacher Routes */}
                <Route
                    path="/teacher"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
                            <TeacherDashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/teacher/students"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
                            <TeacherStudentsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/teacher/courses"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
                            <TeacherCoursesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/teacher/timetable"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
                            <TeacherTimetablePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/teacher/qr-generator"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.TEACHER]}>
                            <TeacherQRCodeGeneratorPage />
                        </ProtectedRoute>
                    }
                />

                {/* Common Protected Routes (if any) */}
                {/* Example: <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} /> */}

                {/* Redirect root path based on role or to login */}
                <Route
                    path="/"
                    element={ <Navigate replace to="/login" /> } // Default redirect if not logged in
                    // You could add logic here to redirect logged-in users based on role
                    // but ProtectedRoute usually handles the initial redirect better.
                />

            </Route>

            {/* Optional: Unauthorized Page */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Not Found Route - Must be last */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRoutes;
