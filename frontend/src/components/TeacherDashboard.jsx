// src/components/TeacherDashboard.jsx
import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../App'; // Import AuthContext
import api from './api.jsx'; // Import API utility
import QrGenerator from './QrGenerator'; // Component to generate QR

function TeacherDashboard() {
    const {auth} = useContext(AuthContext); // Get auth info from context
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null); // Course selected for QR/attendance view
    const [attendanceReport, setAttendanceReport] = useState([]);
    const [students, setStudents] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [error, setError] = useState('');
    const [showQrGenerator, setShowQrGenerator] = useState(false); // Toggle QR Generator
    const [generatedQrData, setGeneratedQrData] = useState(null); // Store generated QR data


    // Fetch teacher's courses
    useEffect(() => {
        const fetchCourses = async () => {
            if (auth.user?.Email_ID) {
                setLoadingCourses(true);
                setError('');
                try {
                    // API Call: Get courses taught by the logged-in teacher
                    const fetchedCourses = await api.getTeacherCourses(auth.user.Email_ID);
                    setCourses(fetchedCourses);
                    // Automatically select the first course if available
                    if (fetchedCourses.length > 0) {
                        // setSelectedCourse(fetchedCourses[0]); // Select first course by default
                    }
                } catch (err) {
                    setError('Failed to fetch courses: ' + err.message);
                    console.error(err);
                } finally {
                    setLoadingCourses(false);
                }
            } else {
                setError("Not authorized or missing Email ID.");
                setLoadingCourses(false);
            }
        };
        fetchCourses();
    }, [auth.user?.Email_ID]);

    // Fetch attendance report when selectedCourse changes
    useEffect(() => {
        const fetchAttendanceReport = async () => {
            if (auth.user?.Email_ID && selectedCourse?.Course_Code) {
                setLoadingReport(true);
                setError('');
                setAttendanceReport([]); // Clear previous report
                try {
                    // API Call: Get attendance report for the selected course
                    const report = await api.getTeacherAttendanceReport(auth.user.Email_ID, selectedCourse.Course_Code);
                    setAttendanceReport(report);
                } catch (err) {
                    setError(`Failed to fetch attendance report for ${selectedCourse.Course_Name}: ${err.message}`);
                    console.error(err);
                } finally {
                    setLoadingReport(false);
                }
            } else {
                setAttendanceReport([]); // Clear report if no course selected
            }
        };
        fetchAttendanceReport();
    }, [selectedCourse, auth.user?.Email_ID]); // Re-fetch if course, token, or email changes

    // Fetch students for the teacher (optional, could be useful)
    useEffect(() => {
        const fetchStudents = async () => {
            if (auth.user?.Email_ID) {
                setLoadingStudents(true);
                setError('');
                try {
                    // API Call: Get all students associated with the teacher's courses
                    const fetchedStudents = await api.getTeacherStudents(auth.user.Email_ID);
                    setStudents(fetchedStudents);
                } catch (err) {
                    setError('Failed to fetch students: ' + err.message);
                    console.error(err);
                } finally {
                    setLoadingStudents(false);
                }
            }
        };
        // fetchStudents(); // Uncomment if you want to load students on dashboard load
    }, [auth.user?.Email_ID]);

    // Handle QR Code Generation
    const handleGenerateQr = async () => {
        if (!selectedCourse || !auth.user?.Email_ID) {
            setError("Please select a course first.");
            return;
        }
        setError('');
        setGeneratedQrData(null); // Clear previous QR
        setShowQrGenerator(true); // Show the generator/loading state

        try {
            // API Call: Generate QR code for the selected course
            const response = await api.generateQrCode({
                Course_Code: selectedCourse.Course_Code,
                Teacher_Email: auth.user.Email_ID
            },);

            if (response.qr && response.qr.QR_ID) {
                // API Call: Get the displayable QR code data (including data URL)
                const displayData = await api.displayQrCode(response.qr.QR_ID);
                setGeneratedQrData(displayData.qr); // Store the full QR data with image URL
            } else {
                throw new Error("QR generation response did not include QR_ID.");
            }

        } catch (err) {
            setError(`Failed to generate QR code: ${err.message}`);
            console.error(err);
            setShowQrGenerator(false); // Hide generator on error
        }
    };


    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h2>

            {error && <p className="text-red-500 bg-red-100 p-3 rounded">{error}</p>}

            {/* Course Selection and Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">My Courses</h3>
                {loadingCourses ? (
                    <p>Loading courses...</p>
                ) : courses.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-4">
                        <label htmlFor="courseSelect" className="text-sm font-medium text-gray-700">Select
                            Course:</label>
                        <select
                            id="courseSelect"
                            value={selectedCourse?.Course_Code || ''}
                            onChange={(e) => {
                                const course = courses.find(c => c.Course_Code === e.target.value);
                                setSelectedCourse(course);
                                setShowQrGenerator(false); // Hide QR generator when changing course
                                setGeneratedQrData(null);
                            }}
                            className="block w-full md:w-auto mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="" disabled>-- Select a Course --</option>
                            {courses.map((course) => (
                                <option key={course.Course_Code} value={course.Course_Code}>
                                    {course.Course_Name} ({course.Course_Code})
                                </option>
                            ))}
                        </select>
                        {/* Button to Generate QR Code */}
                        {selectedCourse && (
                            <button
                                onClick={handleGenerateQr}
                                disabled={showQrGenerator && !generatedQrData} // Disable while loading QR
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 disabled:opacity-50"
                            >
                                {showQrGenerator && !generatedQrData ? 'Generating...' : 'Generate Attendance QR'}
                            </button>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-500">No courses assigned yet. Add courses via the Admin Panel.</p>
                )}
            </div>

            {/* QR Code Generator Display Area */}
            {showQrGenerator && selectedCourse && (
                <div className="bg-white p-6 rounded-lg shadow mt-4">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">
                        QR Code for {selectedCourse.Course_Name}
                    </h3>
                    {generatedQrData ? (
                        <QrGenerator qrData={generatedQrData}/>
                    ) : (
                        <p>Generating QR code...</p>
                    )}
                    <button
                        onClick={() => {
                            setShowQrGenerator(false);
                            setGeneratedQrData(null);
                        }}
                        className="mt-4 bg-gray-400 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                        Close QR
                    </button>
                </div>
            )}


            {/* Attendance Report Section */}
            {selectedCourse && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">
                        Attendance Report for {selectedCourse.Course_Name} ({selectedCourse.Course_Code})
                    </h3>
                    {loadingReport ? (
                        <p>Loading attendance report...</p>
                    ) : attendanceReport.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRN
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student
                                        Name
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total
                                        Classes
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attended
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {attendanceReport.map((student) => (
                                    <tr key={student.PRN}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.PRN}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.Name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.Division}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.total_classes || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.classes_attended || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.attendance_percentage !== null ? `${parseFloat(student.attendance_percentage).toFixed(2)}%` : 'N/A'}
                                            {/* Highlight low attendance */}
                                            {student.attendance_percentage !== null && parseFloat(student.attendance_percentage) < 75 && (
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
                        <p className="text-gray-500">No attendance data available for this course yet.</p>
                    )}
                </div>
            )}

            {/* Optional: Display list of students */}
            {/*
       <div className="bg-white p-6 rounded-lg shadow">
         <h3 className="text-xl font-semibold mb-4 text-gray-700">My Students</h3>
         {loadingStudents ? <p>Loading students...</p> : (
           <ul>
             {students.map(s => <li key={s.PRN}>{s.Name} ({s.PRN}) - {s.Division}</li>)}
           </ul>
         )}
       </div>
       */}
        </div>
    );
}

export default TeacherDashboard;
