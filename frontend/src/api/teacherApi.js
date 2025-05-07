// ========================================================================
// qr-attendance-frontend/src/api/teacherApi.js
// ========================================================================
import apiClient from './axiosConfig';

// Get currently scheduled classes for the logged-in teacher
export const getMyCurrentClasses = async () => {
    const response = await apiClient.get('/teachers/my-current-classes');
    // Array of { Timetable_ID, Course_ID, Course_Name, Div_ID, Division_Name, Teacher_Email, Room_Number, Start_Time, End_Time }
    return response.data;
};

// Get all students (accessible by teachers)
export const getAllStudents = async () => {
    const response = await apiClient.get('/students');
    // Array of { PRN, Name, Mobile_Number, Email_ID, Div_ID, Division_Name, Class_Year }
    return response.data;
};

// Get courses taught by the logged-in teacher
export const getTeacherCourses = async () => {
    const response = await apiClient.get('/teachers/my-courses');
    // Array of { Course_ID, Course_Name, Class_Year }
    return response.data;
};

// Get timetable for the logged-in teacher
export const getTeacherTimetable = async () => {
    const response = await apiClient.get('/teachers/my-timetable');
    // Array of { Timetable_ID, Course_ID, Course_Name, Div_ID, Division_Name, Day_Of_Week, Start_Time, End_Time, Room_Number }
    return response.data;
};

// Generate QR code for a specific course (must be currently scheduled)
export const generateQrCode = async (courseId) => {
    const response = await apiClient.post('/qr/generate', { Course_ID: courseId });
    // { message: '...', qr: { QR_ID, Course_ID, Generated_Time, data_url } }
    return response.data;
};

// Get display data for an existing QR code (if needed)
export const getQrCodeDisplay = async (qrId) => {
    const response = await apiClient.get(`/qr/${qrId}/display`);
    // { message: '...', qr: { QR_ID, Course_ID, Generated_Time, Expires_At, data_url } }
    return response.data;
};

// Create a new timetable entry
export const createTimetableEntry = async (entryData) => {
    const response = await apiClient.post('/timetables', entryData);
    // { message: '...', Timetable_ID }
    return response.data;
};

// Delete a timetable entry
export const deleteTimetableEntry = async (timetableId) => {
    const response = await apiClient.delete(`/timetables/${timetableId}`);
    // { message: '...' }
    return response.data;
};

// Get attendance report for a specific course taught by the teacher
export const getCourseAttendanceReport = async (courseId) => {
    const response = await apiClient.get(`/teachers/my-courses/${courseId}/attendance`);
    // Array of { PRN, Student_Name, Division_Name, Total_Classes_Held, Classes_Attended, Attendance_Percentage }
    return response.data;
}
