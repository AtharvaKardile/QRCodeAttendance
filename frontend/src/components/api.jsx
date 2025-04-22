// src/api.jsx
// Utility functions for making API calls

const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if your backend runs elsewhere

// Helper function to handle fetch requests
const request = async (url, method = 'GET', body = null) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Add Authorization header if token is provided

    // Add body for POST/PUT requests
    if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, options);

        // Check if the response is OK (status code 200-299)
        if (!response.ok) {
            // Try to parse error message from backend
            let errorData;
            try {
                errorData = await response.json(); // Assuming backend sends JSON errors
            } catch (e) {
                errorData = {message: response.statusText}; // Fallback to status text
            }
            console.error('API Error Response:', errorData);
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // Handle responses with no content (e.g., 201 Created, 204 No Content)
        if (response.status === 201 || response.status === 204) {
            try {
                // Attempt to parse JSON, might be empty or contain a simple message
                const data = await response.json();
                return data || {message: 'Operation successful'}; // Return message or empty object
            } catch (e) {
                // If parsing fails (likely empty body), return a success indicator
                return {message: 'Operation successful'};
            }
        }

        // Parse JSON response body for other successful requests
        return await response.json();

    } catch (error) {
        console.error('API Request Failed:', error);
        // Re-throw the error so components can handle it (e.g., show error messages)
        throw error;
    }
};

// --- API Functions ---

const api = {
    // --- Auth ---
    studentLogin: (credentials) => request('/students/login', 'POST', credentials),
    teacherLogin: (credentials) => request('/teachers/login', 'POST', credentials),
    studentRegister: (data) => request('/students/register', 'POST', data),
    teacherRegister: (data) => request('/teachers/register', 'POST', data),

    // --- Classes ---
    getClasses: () => request('/classes', 'GET'),
    addClass: (data, token) => request('/classes', 'POST', data),

    // --- Divisions ---
    getDivisions: () => request('/divisions'),
    addDivision: (data, token) => request('/divisions', 'POST', data),
    getDivisionsByClass: (classId) => request(`/classes/${classId}/divisions`),
    updateDivision: (divisionId, data, token) => request(`/divisions/${divisionId}`, 'PUT', data),

    // --- Courses ---
    getCourses: () => request('/courses'),
    addCourse: (data, token) => request('/courses', 'POST', data),
    getCoursesByClass: (classId) => request(`/classes/${classId}/courses`),

    // --- Students ---
    getStudents: () => request('/students'),
    getStudentCourses: (prn, token) => request(`/students/${prn}/courses`, 'GET', null),
    assignStudentToCourse: (prn, courseData, token) => request(`/students/${prn}/courses`, 'POST', courseData),
    getStudentAttendance: (prn, token) => request(`/students/${prn}/attendance`, 'GET', null),

    // --- Teachers ---
    getTeachers: () => request('/teachers'),
    getTeacherStudents: (email, token) => request(`/teachers/${email}/students`, 'GET', null),
    getTeacherCourses: (email, token) => request(`/teachers/${email}/courses`, 'GET', null),
    assignTeacherToCourse: (email, courseData, token) => request(`/teachers/${email}/courses`, 'POST', courseData),
    getTeacherAttendanceReport: (email, courseCode, token) => request(`/teachers/${email}/courses/${courseCode}/attendance`, 'GET', null),

    // --- Attendance / QR ---
    generateQrCode: (qrData, token) => request('/qr/generate', 'POST', qrData),
    markAttendance: (attendanceData, token) => request('/attendance/mark', 'POST', attendanceData),
    getActiveQrCodes: (courseCode, token) => request(`/courses/${courseCode}/active-qr`, 'GET', null),
    displayQrCode: (qrId) => request(`/qr/${qrId}/display`, 'GET', null)
};

export default api;