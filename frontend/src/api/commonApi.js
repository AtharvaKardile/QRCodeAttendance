// ========================================================================
// qr-attendance-frontend/src/api/commonApi.js
// ========================================================================
import apiClient from './axiosConfig';

// Get all courses
export const getAllCourses = async () => {
    const response = await apiClient.get('/courses');
    // Array of { Course_ID, Course_Name, Class_ID, Class_Year }
    return response.data;
};

// Get all classes
export const getAllClasses = async () => {
    const response = await apiClient.get('/classes');
    // Array of { Class_ID, Year, No_Of_Students }
    return response.data;
};

// Get all divisions
export const getAllDivisions = async () => {
    const response = await apiClient.get('/divisions');
    // Array of { Div_ID, Name, Class_ID, Class_Year }
    return response.data;
};

// Get divisions for a specific class
export const getDivisionsByClass = async (classId) => {
    const response = await apiClient.get(`/classes/${classId}/divisions`);
    // Array of { Div_ID, Name, Class_ID }
    return response.data;
}
