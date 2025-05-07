// ========================================================================
// qr-attendance-frontend/src/pages/Teacher/TeacherDashboardPage.jsx
// ========================================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import GroupIcon from '@mui/icons-material/Group';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import { useAuth } from '../../ context/useAuth.js';
import { getMyCurrentClasses } from '../../api/teacherApi';
import PageLoader from '../../components/UI/PageLoader';
import ErrorAlert from '../../components/UI/ErrorAlert';

const TeacherDashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentClasses, setCurrentClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCurrentClasses = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getMyCurrentClasses();
                setCurrentClasses(data || []);
            } catch (err) {
                console.error("Failed to fetch current classes:", err);
                setError("Could not load your current schedule. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentClasses();
    }, []);

    if (loading) {
        return <PageLoader />;
    }

    // Format time for display (HH:MM)
    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Teacher Dashboard
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'text.secondary' }}>
                Welcome, {user?.Name}!
            </Typography>

            {error && <ErrorAlert error={error} sx={{ mb: 3 }} />}

            <Grid container spacing={3}>
                {/* Current Classes Card */}
                <Grid item xs={12} md={7}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Today's Active Classes
                            </Typography>
                            {currentClasses.length === 0 && !error && (
                                <Typography sx={{ mt: 2 }}>
                                    No classes currently scheduled for you at this time.
                                </Typography>
                            )}
                            <List dense>
                                {currentClasses.map((cls) => (
                                    <React.Fragment key={cls.Timetable_ID}>
                                        <ListItem disableGutters>
                                            <ListItemText
                                                primary={`${cls.Course_Name} (${cls.Division_Name})`}
                                                secondary={
                                                    <>
                                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                            <AccessTimeIcon fontSize="inherit" sx={{ mr: 0.5 }} /> {formatTime(cls.Start_Time)} - {formatTime(cls.End_Time)}
                                                        </Box>
                                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                            <LocationOnIcon fontSize="inherit" sx={{ mr: 0.5 }} /> Room: {cls.Room_Number}
                                                        </Box>
                                                    </>
                                                }
                                            />
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<QrCodeScannerIcon />}
                                                onClick={() => navigate('/teacher/qr-generator', { state: { preselectedCourseId: cls.Course_ID } })} // Pass course ID
                                            >
                                                Generate QR
                                            </Button>
                                        </ListItem>
                                        <Divider component="li" />
                                    </React.Fragment>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick Actions Card */}
                <Grid item xs={12} md={5}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Quick Actions
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<QrCodeScannerIcon />}
                                    onClick={() => navigate('/teacher/qr-generator')}
                                    fullWidth
                                >
                                    Generate Attendance QR
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<GroupIcon />}
                                    onClick={() => navigate('/teacher/students')}
                                    fullWidth
                                >
                                    Manage Students
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<SchoolIcon />}
                                    onClick={() => navigate('/teacher/courses')}
                                    fullWidth
                                >
                                    View My Courses
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<EventIcon />}
                                    onClick={() => navigate('/teacher/timetable')}
                                    fullWidth
                                >
                                    Manage Timetable
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeacherDashboardPage;
