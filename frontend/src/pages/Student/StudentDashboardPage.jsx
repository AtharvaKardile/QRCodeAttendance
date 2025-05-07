// ========================================================================
// qr-attendance-frontend/src/pages/Student/StudentDashboardPage.jsx
// ========================================================================
import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import { useAuth } from '../../ context/useAuth.js';
import { getMyAttendanceSummary, getMyCourses } from '../../api/studentApi';
import PageLoader from '../../components/UI/PageLoader';
import ErrorAlert from '../../components/UI/ErrorAlert';

// Helper to determine progress bar color based on percentage
const getProgressColor = (percentage) => {
    if (percentage < 50) return 'error';
    if (percentage < 75) return 'warning';
    return 'success';
};

const StudentDashboardPage = () => {
    const { user } = useAuth();
    const [attendanceSummary, setAttendanceSummary] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch both attendance and courses concurrently
                const [attendanceData, coursesData] = await Promise.all([
                    getMyAttendanceSummary(),
                    getMyCourses(),
                ]);
                setAttendanceSummary(attendanceData || []);
                setEnrolledCourses(coursesData || []);
            } catch (err) {
                console.error("Failed to fetch student dashboard data:", err);
                setError("Could not load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []); // Fetch on component mount

    if (loading) {
        return <PageLoader />;
    }

    // Calculate overall attendance (simple average for now)
    const totalPercentage = attendanceSummary.reduce((acc, course) => acc + (course.Attendance_Percentage || 0), 0);
    const averagePercentage = attendanceSummary.length > 0 ? (totalPercentage / attendanceSummary.length).toFixed(1) : 0;

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Welcome, {user?.Name}!
            </Typography>

            {error && <ErrorAlert error={error} sx={{ mb: 3 }} />}

            <Grid container spacing={3}>
                {/* Attendance Summary Card */}
                <Grid item xs={12} md={7}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Attendance Summary
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Overall Average: {averagePercentage}%
                            </Typography>
                            {attendanceSummary.length === 0 && !error && (
                                <Typography sx={{ mt: 2 }}>No attendance data available yet.</Typography>
                            )}
                            <List dense>
                                {attendanceSummary.map((course) => (
                                    <React.Fragment key={course.Course_ID}>
                                        <ListItem disableGutters>
                                            <ListItemText
                                                primary={course.Course_Name}
                                                secondary={`Attended: ${course.Classes_Attended || 0} / ${course.Total_Classes_Held || 0}`}
                                            />
                                            <Box sx={{ width: '30%', mr: 1 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={course.Attendance_Percentage || 0}
                                                    color={getProgressColor(course.Attendance_Percentage)}
                                                    sx={{ height: 8, borderRadius: 4 }}
                                                />
                                            </Box>
                                            <Typography variant="body2" sx={{ minWidth: '40px', textAlign: 'right' }}>
                                                {`${(course.Attendance_Percentage || 0).toFixed(1)}%`}
                                            </Typography>
                                        </ListItem>
                                        {/* Optional: Add warning for low attendance */}
                                        {course.Attendance_Percentage < 75 && course.Total_Classes_Held > 0 && (
                                            <Alert severity="warning" variant="outlined" sx={{ mt: 0.5, mb: 1, py: 0, px: 1, fontSize: '0.8rem' }}>
                                                Low attendance
                                            </Alert>
                                        )}
                                        <Divider component="li" />
                                    </React.Fragment>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Enrolled Courses Card */}
                <Grid item xs={12} md={5}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                My Enrolled Courses
                            </Typography>
                            {enrolledCourses.length === 0 && !error && (
                                <Typography sx={{ mt: 2 }}>You are not enrolled in any courses yet.</Typography>
                            )}
                            <List dense>
                                {enrolledCourses.map((course) => (
                                    <ListItem key={course.Course_ID} disableGutters>
                                        <ListItemText
                                            primary={course.Course_Name}
                                            secondary={`Class Year: ${course.Class_Year || 'N/A'}`}
                                        />
                                        {/* Optional: Add link to course details page */}
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Optional: Add a section for QR Code Scanning if needed directly on dashboard */}
                {/*
         <Grid item xs={12}>
             <Card>
                 <CardContent>
                     <Typography variant="h6" gutterBottom>Scan QR Code</Typography>
                     // Add QR Scanner Component here
                 </CardContent>
             </Card>
         </Grid>
         */}

            </Grid>
        </Box>
    );
};

export default StudentDashboardPage;
