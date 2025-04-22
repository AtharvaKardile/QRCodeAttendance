// src/App.jsx
import React, {createContext, useEffect, useState} from 'react';
import Auth from './components/Auth';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard'; // Added for admin functions

// Create context to manage auth state globally
export const AuthContext = createContext(null);

function App() {
    // State for managing the current view/page
    const [currentView, setCurrentView] = useState('auth'); // 'auth', 'student', 'teacher', 'admin'
    // State for storing authentication info (token and user data)
    const [auth, setAuth] = useState({token: localStorage.getItem('token'), user: null, role: null});
    // Loading state
    const [loading, setLoading] = useState(true);

    // Effect to check token validity or fetch user data on initial load (optional)
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('role'); // Assuming role is stored
        const userData = JSON.parse(localStorage.getItem('user')); // Assuming user data is stored

        if (token && userRole && userData) {
            // Basic validation: If token exists, assume user is logged in
            // A better approach would be to verify the token with the backend here
            setAuth({token: token, user: userData, role: userRole});
            setCurrentView(userRole); // Navigate to the respective dashboard
        } else {
            setCurrentView('auth'); // Default to auth view if no token/role
        }
        setLoading(false); // Finished initial check
    }, []);

    // Function to handle successful login
    const handleLogin = (token, user, role) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('role', role);
        setAuth({token, user, role});
        setCurrentView(role); // Navigate based on role
        console.log(`Logged in as ${role}:`, user);
    };

    // Function to handle logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setAuth({token: null, user: null, role: null});
        setCurrentView('auth'); // Go back to login page
        console.log('Logged out');
    };

    // Render loading state
    if (loading) {
        return <div className="flex justify-center items-center h-screen text-xl">Loading...</div>;
    }

    // Simple Router Logic based on 'currentView' state
    const renderView = () => {
        switch (currentView) {
            case 'student':
                return <StudentDashboard/>;
            case 'teacher':
                return <TeacherDashboard/>;
            case 'admin': // Added Admin view
                return <AdminDashboard/>;
            case 'auth':
            default:
                // Pass handleLogin to Auth component
                return <Auth onLogin={handleLogin}/>;
        }
    };

    return (
        // Provide auth context to children
        <AuthContext.Provider value={{auth, logout: handleLogout}}>
            <div className="min-h-screen bg-gray-100 font-inter">
                {/* Basic Navbar - shown only when logged in */}
                {auth.token && (
                    <nav className="bg-blue-600 text-white p-4 shadow-md">
                        <div className="container mx-auto flex justify-between items-center">
                            <span className="text-xl font-bold">Attendance System</span>
                            <div>
                                <span
                                    className="mr-4">Welcome, {auth.user?.Name || auth.user?.email || 'User'} ({auth.role})</span>
                                {/* Admin controls access */}
                                {auth.role === 'teacher' && ( // Or a dedicated admin role
                                    <button
                                        onClick={() => setCurrentView('admin')}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded mr-2 transition duration-300"
                                    >
                                        Admin Panel
                                    </button>
                                )}
                                {/* Back to Dashboard Button */}
                                {(currentView === 'admin') && (
                                    <button
                                        onClick={() => setCurrentView(auth.role)} // Go back to original role dashboard
                                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2 transition duration-300"
                                    >
                                        Back to Dashboard
                                    </button>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </nav>
                )}
                {/* Main Content Area */}
                <main className="container mx-auto p-4">
                    {renderView()}
                </main>
            </div>
        </AuthContext.Provider>
    );
}

export default App;


// src/components/Auth.jsx


// src/components/AdminDashboard.jsx


// src/components/QrScanner.jsx


// src/components/QrGenerator.jsx





