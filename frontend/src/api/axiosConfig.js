// ========================================================================
// qr-attendance-frontend/src/api/axiosConfig.js
// ========================================================================
import axios from 'axios';

// Get the API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Fallback

// Create an Axios instance
const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api`, // Append /api to the base URL
    withCredentials: true, // Crucial for sending cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Optional: Add interceptors for request or response handling (e.g., logging, error handling)
apiClient.interceptors.response.use(
    (response) => response, // Simply return successful responses
    (error) => {
        // Handle errors globally if needed (e.g., redirect on 401)
        console.error('API Error:', error.response || error.message);
        // You could check for error.response.status === 401 here and trigger logout
        return Promise.reject(error); // Important to reject the promise
    }
);

export default apiClient;
