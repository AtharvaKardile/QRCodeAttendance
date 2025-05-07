// ========================================================================
// qr-attendance-frontend/src/api/studentApi.js
// ========================================================================
import apiClient from './axiosConfig';

// Get attendance summary for the logged-in student
export const getMyAttendanceSummary = async () => {
    const response = await apiClient.get('/students/my-attendance');
    return response.data; // Array of { Course_ID, Course_Name, Total_Classes_Held, Classes_Attended, Attendance_Percentage }
};

// Get courses the logged-in student is enrolled in
export const getMyCourses = async () => {
    const response = await apiClient.get('/students/my-courses');
    return response.data; // Array of { Course_ID, Course_Name, Class_Year }
};

// Mark attendance using a QR code ID
export const markAttendance = async (qrId) => {
    const response = await apiClient.post('/attendance/mark', { QR_ID: qrId });
    return response.data; // { message: '...' }
};
