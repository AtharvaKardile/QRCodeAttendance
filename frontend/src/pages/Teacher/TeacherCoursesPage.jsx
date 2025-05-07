// ========================================================================
// qr-attendance-frontend/src/pages/Teacher/TeacherCoursesPage.jsx
// ========================================================================
import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { getTeacherCourses } from '../../api/teacherApi'; // Removed getAllCourses import
import { getCourseAttendanceReport } from '../../api/teacherApi'; // For viewing attendance
import PageLoader from '../../components/UI/PageLoader';
import ErrorAlert from '../../components/UI/ErrorAlert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TablePagination from '@mui/material/TablePagination'; // Import for attendance report

const TeacherCoursesPage = () => {
    const [myCourses, setMyCourses] = useState([]);
    // const [allCourses, setAllCourses] = useState([]); // Optional: If needed for assigning
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null); // For attendance modal
    const [attendanceReport, setAttendanceReport] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState(null);
    const [reportPage, setReportPage] = useState(0);
    const [reportRowsPerPage, setReportRowsPerPage] = useState(5);


    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch courses taught by the teacher
                const teacherCoursesData = await getTeacherCourses();
                setMyCourses(teacherCoursesData || []);

                // Optional: Fetch all courses if needed for assignment functionality
                // const allCoursesData = await getAllCourses();
                // setAllCourses(allCoursesData || []);

            } catch (err) {
                console.error("Failed to fetch courses:", err);
                setError("Could not load course data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    // --- Attendance Report Modal Logic ---
    const handleViewAttendance = async (course) => {
        setSelectedCourse(course);
        setReportLoading(true);
        setReportError(null);
        setAttendanceReport([]); // Clear previous report
        setReportPage(0); // Reset pagination
        setReportRowsPerPage(5);
        try {
            const reportData = await getCourseAttendanceReport(course.Course_ID);
            setAttendanceReport(reportData || []);
        } catch(err) {
            console.error(`Failed to fetch attendance for ${course.Course_Name}:`, err);
            setReportError(`Could not load attendance report for ${course.Course_Name}.`);
        } finally {
            setReportLoading(false);
        }
    }

    const handleCloseAttendanceModal = () => {
        setSelectedCourse(null);
        setAttendanceReport([]);
        setReportError(null);
    }

    const handleReportChangePage = (event, newPage) => {
        setReportPage(newPage);
    };

    const handleReportChangeRowsPerPage = (event) => {
        setReportRowsPerPage(parseInt(event.target.value, 10));
        setReportPage(0);
    };

    const paginatedAttendanceReport = attendanceReport.slice(reportPage * reportRowsPerPage, reportPage * reportRowsPerPage + reportRowsPerPage);
    // --- End Attendance Report Modal Logic ---


    if (loading) {
        return <PageLoader />;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                My Courses
            </Typography>

            {error && <ErrorAlert error={error} sx={{ mb: 3 }} />}

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Courses I Teach
                    </Typography>
                    <TableContainer component={Paper} elevation={0} variant="outlined">
                        <Table sx={{ minWidth: 650 }} aria-label="my courses table">
                            <TableHead sx={{ backgroundColor: 'grey.100' }}>
                                <TableRow>
                                    <TableCell>Course ID</TableCell>
                                    <TableCell>Course Name</TableCell>
                                    <TableCell>Class Year</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {myCourses.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            You are not currently assigned to any courses.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {myCourses.map((course) => (
                                    <TableRow
                                        key={course.Course_ID}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell>{course.Course_ID}</TableCell>
                                        <TableCell>{course.Course_Name}</TableCell>
                                        <TableCell>{course.Class_Year || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleViewAttendance(course)}
                                            >
                                                View Attendance
                                            </Button>
                                            {/* Add other actions like "Assign Students" if needed */}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Optional: Section to assign teacher to courses */}
            {/* <Card sx={{ mt: 3 }}> ... </Card> */}


            {/* Attendance Report Modal */}
            <Dialog open={!!selectedCourse} onClose={handleCloseAttendanceModal} maxWidth="md" fullWidth>
                <DialogTitle>Attendance Report: {selectedCourse?.Course_Name}</DialogTitle>
                <DialogContent>
                    {reportLoading && <PageLoader size={30} />}
                    {reportError && <ErrorAlert error={reportError} />}
                    {!reportLoading && !reportError && (
                        <>
                            <TableContainer component={Paper} elevation={0} variant="outlined">
                                <Table size="small">
                                    <TableHead sx={{ backgroundColor: 'grey.100' }}>
                                        <TableRow>
                                            <TableCell>PRN</TableCell>
                                            <TableCell>Student Name</TableCell>
                                            <TableCell>Division</TableCell>
                                            <TableCell align="right">Attended</TableCell>
                                            <TableCell align="right">Total Held</TableCell>
                                            <TableCell align="right">Percentage</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedAttendanceReport.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">No attendance data available for this course.</TableCell>
                                            </TableRow>
                                        )}
                                        {paginatedAttendanceReport.map((row) => (
                                            <TableRow key={row.PRN}>
                                                <TableCell>{row.PRN}</TableCell>
                                                <TableCell>{row.Student_Name}</TableCell>
                                                <TableCell>{row.Division_Name}</TableCell>
                                                <TableCell align="right">{row.Classes_Attended || 0}</TableCell>
                                                <TableCell align="right">{row.Total_Classes_Held || 0}</TableCell>
                                                <TableCell align="right">{`${(row.Attendance_Percentage || 0).toFixed(1)}%`}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25]}
                                component="div"
                                count={attendanceReport.length}
                                rowsPerPage={reportRowsPerPage}
                                page={reportPage}
                                onPageChange={handleReportChangePage}
                                onRowsPerPageChange={handleReportChangeRowsPerPage}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAttendanceModal}>Close</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default TeacherCoursesPage;