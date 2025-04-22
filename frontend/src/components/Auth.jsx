import React, {useState} from 'react';
import api from './api.jsx'; // Import API utility

function Auth({onLogin}) {
    const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
    const [role, setRole] = useState('student'); // 'student' or 'teacher'
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(''); // For registration success

    const handleInputChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
        setError(''); // Clear error on input change
        setSuccessMessage(''); // Clear success message
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            let response;
            if (isLogin) {
                // --- Login Logic ---
                if (role === 'student') {
                    // API Call: Student Login
                    response = await api.studentLogin({
                        Email_ID: formData.Email_ID,
                        Password: formData.Password,
                    });
                    if (response.token && response.student) {
                        onLogin(response.token, response.student, 'student'); // Pass token, user data, and role up
                    } else {
                        throw new Error(response.message || 'Login failed: Invalid response from server.');
                    }
                } else { // Teacher Login
                    // API Call: Teacher Login
                    response = await api.teacherLogin({
                        Email_ID: formData.Email_ID,
                        Password: formData.Password,
                    });
                    if (response.token && response.teacher) {
                        onLogin(response.token, response.teacher, 'teacher'); // Pass token, user data, and role up
                    } else {
                        throw new Error(response.message || 'Login failed: Invalid response from server.');
                    }
                }
            } else {
                // --- Registration Logic ---
                if (role === 'student') {
                    // API Call: Student Register
                    response = await api.studentRegister({
                        PRN: formData.PRN,
                        Name: formData.Name,
                        Mobile_Number: formData.Mobile_Number,
                        Email_ID: formData.Email_ID,
                        Password: formData.Password,
                        Div_ID: formData.Div_ID, // Make sure this field is in the form
                    });
                    setSuccessMessage(response.message || 'Student registered successfully! Please login.');
                    setIsLogin(true); // Switch back to log in form after successful registration
                    setFormData({}); // Clear form data

                } else { // Teacher Register
                    // API Call: Teacher Register
                    response = await api.teacherRegister({
                        Email_ID: formData.Email_ID,
                        Name: formData.Name,
                        Password: formData.Password,
                        Mobile_Number: formData.Mobile_Number,
                    });
                    setSuccessMessage(response.message || 'Teacher registered successfully! Please login.');
                    setIsLogin(true); // Switch back to log in form
                    setFormData({}); // Clear form data
                }
            }
        } catch (err) {
            console.error("Auth Error:", err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]"> {/* Adjust height if needed */}
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-800">
                    {isLogin ? `${role === 'student' ? 'Student' : 'Teacher'} Login` : `${role === 'student' ? 'Student' : 'Teacher'} Registration`}
                </h2>

                {/* Role Selection */}
                <div className="flex justify-center space-x-4 mb-6">
                    <button
                        onClick={() => setRole('student')}
                        className={`px-4 py-2 rounded ${role === 'student' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        Student
                    </button>
                    <button
                        onClick={() => setRole('teacher')}
                        className={`px-4 py-2 rounded ${role === 'teacher' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        Teacher
                    </button>
                </div>

                {/* Display Success Message */}
                {successMessage && (
                    <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
                        {successMessage}
                    </div>
                )}

                {/* Display Error Message */}
                {error && (
                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Common Fields: Email, Password */}
                    <div>
                        <label htmlFor="Email_ID" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="Email_ID"
                            id="Email_ID"
                            required
                            value={formData.Email_ID || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="Password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="Password"
                            id="Password"
                            required
                            value={formData.Password || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    {/* Registration Specific Fields */}
                    {!isLogin && (
                        <>
                            <div>
                                <label htmlFor="Name" className="block text-sm font-medium text-gray-700">Full
                                    Name</label>
                                <input
                                    type="text"
                                    name="Name"
                                    id="Name"
                                    required
                                    value={formData.Name || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="Mobile_Number" className="block text-sm font-medium text-gray-700">Mobile
                                    Number</label>
                                <input
                                    type="tel" // Use 'tel' for mobile numbers
                                    name="Mobile_Number"
                                    id="Mobile_Number"
                                    required
                                    value={formData.Mobile_Number || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            {/* Student Specific Registration Fields */}
                            {role === 'student' && (
                                <>
                                    <div>
                                        <label htmlFor="PRN" className="block text-sm font-medium text-gray-700">PRN
                                            (Student ID)</label>
                                        <input
                                            type="text"
                                            name="PRN"
                                            id="PRN"
                                            required
                                            value={formData.PRN || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="Div_ID" className="block text-sm font-medium text-gray-700">Div
                                            ID</label>
                                        <input
                                            type="text" // Consider making this a dropdown fetched from API later
                                            name="Div_ID"
                                            id="Div_ID"
                                            required
                                            value={formData.Div_ID || ''}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Enter existing Division ID"
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
                        </button>
                    </div>
                </form>

                {/* Toggle between Login and Register */}
                <div className="text-center text-sm text-gray-600">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                            setSuccessMessage('');
                            setFormData({});
                        }} // Clear form on toggle
                        className="font-medium text-blue-600 hover:text-blue-500"
                    >
                        {isLogin ? 'Register here' : 'Login here'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Auth;

