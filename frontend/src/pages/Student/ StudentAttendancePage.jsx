// ========================================================================
// qr-attendance-frontend/src/pages/Student/StudentAttendancePage.jsx
// ========================================================================
import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
// Import necessary components and hooks
import { getMyAttendanceSummary } from '../../api/studentApi';
import PageLoader from '../../components/UI/PageLoader';
import ErrorAlert from '../../components/UI/ErrorAlert';

// Helper to determine progress bar color based on percentage
const getProgressColor = (percentage) => {
    if (percentage < 50) return 'error';
    if (percentage < 75) return 'warning';
    return 'success';
};

// NOTE: This page currently shows the same summary as the dashboard.
// It could be enhanced to show detailed logs per course or allow filtering.
const StudentAttendancePage = () => {
    const [attendanceSummary, setAttendanceSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getMyAttendanceSummary();
                setAttendanceSummary(data || []);
            } catch (err) {
                console.error("Failed to fetch student attendance data:", err);
                setError("Could not load attendance data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <PageLoader />;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                My Attendance Details
            </Typography>

            {error && <ErrorAlert error={error} sx={{ mb: 3 }} />}

            <Card>
                <CardContent>
                    {attendanceSummary.length === 0 && !error && (
                        <Typography sx={{ mt: 2 }}>No attendance data available yet.</Typography>
                    )}
                    <List>
                        {attendanceSummary.map((course) => (
                            <React.Fragment key={course.Course_ID}>
                                <ListItem disableGutters sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <ListItemText
                                        primary={course.Course_Name}
                                        secondary={`Attended: ${course.Classes_Attended || 0} / ${course.Total_Classes_Held || 0} classes`}
                                        sx={{ flexBasis: '50%', mb: { xs: 1, sm: 0 } }} // Adjust spacing
                                    />
                                    <Box sx={{ width: { xs: '100%', sm: '30%'}, mr: 1, display: 'flex', alignItems: 'center' }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={course.Attendance_Percentage || 0}
                                            color={getProgressColor(course.Attendance_Percentage)}
                                            sx={{ height: 8, borderRadius: 4, flexGrow: 1 }}
                                        />
                                    </Box>
                                    <Typography variant="body1" sx={{ minWidth: '50px', textAlign: 'right', flexBasis: { xs: '100%', sm: 'auto' }, mt: { xs: 1, sm: 0 } }}>
                                        {`${(course.Attendance_Percentage || 0).toFixed(1)}%`}
                                    </Typography>
                                </ListItem>
                                {/* Optional: Add warning for low attendance */}
                                {course.Attendance_Percentage < 75 && course.Total_Classes_Held > 0 && (
                                    <Alert severity="warning" variant="outlined" sx={{ mt: 0.5, mb: 1, py: 0, px: 1, fontSize: '0.8rem' }}>
                                        Low attendance - Please ensure you meet the requirements.
                                    </Alert>
                                )}
                                <Divider component="li" sx={{ my: 1 }} />
                            </React.Fragment>
                        ))}
                    </List>
                    {/* Placeholder for future enhancements */}
                    {/* <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Detailed attendance logs per course coming soon.
           </Typography> */}
                </CardContent>
            </Card>
        </Box>
    );
};

export default StudentAttendancePage;
