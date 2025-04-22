// src/components/StudentDashboard.jsx
import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../App'; // Import AuthContext
import api from './api.jsx'; // Import API utility
import QrScanner from './QrScanner'; // Component to handle QR scanning

function StudentDashboard() {
    const {auth} = useContext(AuthContext); // Get auth info from context
    const [courses, setCourses] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingAttendance, setLoadingAttendance] = useState(true);
    const [error, setError] = useState('');
    const [showScanner, setShowScanner] = useState(false); // State to toggle QR Scanner

    // Fetch student's courses
    useEffect(() => {
        const fetchCourses = async () => {
            if (auth.token && auth.user?.PRN) {
                setLoadingCourses(true);
                setError('');
                try {
                    // API Call: Get courses for the logged-in student
                    const fetchedCourses = await api.getStudentCourses(auth.user.PRN, auth.token);
                    setCourses(fetchedCourses);
                } catch (err) {
                    setError('Failed to fetch courses: ' + err.message);
                    console.error(err);
                } finally {
                    setLoadingCourses(false);
                }
            } else {
                setError("Not authorized or missing PRN.");
                setLoadingCourses(false);
            }
        };

        fetchCourses();
    }, [auth.token, auth.user?.PRN]); // Re-fetch if token or PRN changes

    // Fetch student's attendance summary
    useEffect(() => {
        const fetchAttendance = async () => {
            if (auth.token && auth.user?.PRN) {
                setLoadingAttendance(true);
                setError(''); // Clear previous errors specific to attendance
                try {
                    // API Call: Get attendance summary for the logged-in student
                    const fetchedAttendance = await api.getStudentAttendance(auth.user.PRN, auth.token);
                    setAttendance(fetchedAttendance);
                } catch (err) {
                    setError('Failed to fetch attendance: ' + err.message);
                    console.error(err);
                } finally {
                    setLoadingAttendance(false);
                }
            } else {
                setError("Not authorized or missing PRN.");
                setLoadingAttendance(false);
            }
        };

        fetchAttendance();
    }, [auth.token, auth.user?.PRN]); // Re-fetch if token or PRN changes

    const handleScanSuccess = async (qrId) => {
        console.log(`QR Scanned: ${qrId}`);
        setShowScanner(false); // Close scanner after scan
        setError(''); // Clear previous errors

        if (!auth.token || !auth.user?.PRN) {
            setError("Cannot mark attendance: Not logged in or PRN missing.");
            return;
        }

        try {
            // API Call: Mark attendance using the scanned QR ID
            const response = await api.markAttendance({PRN: auth.user.PRN, QR_ID: qrId}, auth.token);
            alert(response.message || 'Attendance marked successfully!'); // Simple feedback
            // Optionally re-fetch attendance data here to update the view immediately
            // fetchAttendance(); // Uncomment if needed
        } catch (err) {
            setError(`Failed to mark attendance: ${err.message}`);
            console.error(err);
            alert(`Failed to mark attendance: ${err.message}`); // Show error in alert
        }
    };

    const handleScanError = (err) => {
        console.error("QR Scan Error:", err);
        setError("QR Scan failed. Please try again.");
        setShowScanner(false); // Optionally close scanner on error
    };


    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Student Dashboard</h2>

            {error && <p className="text-red-500 bg-red-100 p-3 rounded">{error}</p>}

            {/* Button to open QR Scanner */}
            <button
                onClick={() => setShowScanner(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300"
            >
                Scan QR Code to Mark Attendance
            </button>

            {/* QR Scanner Modal (or inline display) */}
            {showScanner && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-xl font-semibold mb-4">Scan Attendance QR Code</h3>
                        <QrScanner
                            onScanSuccess={handleScanSuccess}
                            onScanError={handleScanError}
                        />
                        <button
                            onClick={() => setShowScanner(false)}
                            className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}


            {/* My Courses Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">My Courses</h3>
                {loadingCourses ? (
                    <p>Loading courses...</p>
                ) : courses.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                        {courses.map((course) => (
                            <li key={course.Course_Code} className="text-gray-600">
                                {course.Course_Name} ({course.Course_Code})
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No courses assigned yet.</p>
                )}
            </div>

            {/* My Attendance Summary Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">My Attendance Summary</h3>
                {loadingAttendance ? (
                    <p>Loading attendance...</p>
                ) : attendance.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course
                                    Name
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course
                                    Code
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total
                                    Classes
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes
                                    Attended
                                </th>
                                <th scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {attendance.map((att) => (
                                <tr key={att.Course_Code}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{att.Course_Name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{att.Course_Code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{att.total_classes || 0}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{att.classes_attended || 0}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {att.attendance_percentage !== null ? `${parseFloat(att.attendance_percentage).toFixed(2)}%` : 'N/A'}
                                        {/* Add visual indicator for low attendance */}
                                        {att.attendance_percentage !== null && parseFloat(att.attendance_percentage) < 75 && (
                                            <span
                                                className="ml-2 text-xs font-semibold inline-block py-1 px-2 uppercase rounded text-red-600 bg-red-200">
                           Low
                         </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No attendance data available yet.</p>
                )}
            </div>
        </div>
    );
}

export default StudentDashboard;

