// ========================================================================
// qr-attendance-frontend/src/api/authApi.js
// ========================================================================
import apiClient from './axiosConfig';

export const loginStudent = async (credentials) => {
    const response = await apiClient.post('/students/login', credentials);
    return response.data; // { message: '...', student: { ... } }
};

export const loginTeacher = async (credentials) => {
    const response = await apiClient.post('/teachers/login', credentials);
    return response.data; // { message: '...', teacher: { ... } }
};

export const registerStudent = async (studentData) => {
    const response = await apiClient.post('/students/register', studentData);
    return response.data; // { message: '...', student: { ... } }
};

// Assuming teacher registration is possible via API (add if needed)
export const registerTeacher = async (teacherData) => {
    const response = await apiClient.post('/teachers/register', teacherData);
    return response.data; // { message: '...', teacher: { ... } }
};


export const logoutUser = async () => {
    const response = await apiClient.post('/logout');
    return response.data; // { message: '...' }
};
