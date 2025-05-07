// ========================================================================
// qr-attendance-frontend/src/pages/Teacher/TeacherQRCodeGeneratorPage.jsx
// ========================================================================
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // To get preselected course ID
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import QRCode from 'qrcode.react'; // Using qrcode.react library
import { getMyCurrentClasses, generateQrCode, getQrCodeDisplay } from '../../api/teacherApi';
import ErrorAlert from '../../components/UI/ErrorAlert';
import SuccessSnackbar from '../../components/UI/SuccessSnackbar';
import Grid from '@mui/material/Grid'; // Import the Grid component

const TeacherQRCodeGeneratorPage = () => {
    const location = useLocation(); // Get location object
    const preselectedCourseId = location.state?.preselectedCourseId; // Get passed state

    const [currentClasses, setCurrentClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState(''); // Store Course_ID
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingGenerate, setLoadingGenerate] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [generatedQR, setGeneratedQR] = useState(null); // { QR_ID, Course_ID, Generated_Time, data_url, Expires_At? }
    const [qrTimer, setQrTimer] = useState(null); // Interval ID for timer
    const [qrTimeLeft, setQrTimeLeft] = useState(0); // Time left in seconds

    // Fetch current classes for the dropdown
    useEffect(() => {
        const fetchClasses = async () => {
            setLoadingClasses(true);
            setError(null);
            setGeneratedQR(null); // Clear previous QR on load
            try {
                const data = await getMyCurrentClasses();
                setCurrentClasses(data || []);
                // If a course ID was passed via navigation state, preselect it
                if (preselectedCourseId && data.some(cls => cls.Course_ID === preselectedCourseId)) {
                    setSelectedClassId(preselectedCourseId);
                } else if (data?.length > 0) {
                    // Optionally select the first available class if none preselected
                    // setSelectedClassId(data[0].Course_ID);
                }
            } catch (err) {
                console.error("Failed to fetch current classes:", err);
                setError("Could not load your currently scheduled classes.");
            } finally {
                setLoadingClasses(false);
            }
        };
        fetchClasses();

        // Cleanup timer on unmount
        return () => {
            if (qrTimer) clearInterval(qrTimer);
        };
    }, [preselectedCourseId]); // Re-run if preselectedCourseId changes (though unlikely)


    // Timer effect for generated QR code
    useEffect(() => {
        if (generatedQR?.Generated_Time) {
            const generatedTime = new Date(generatedQR.Generated_Time);
            const expiryTime = generatedTime.getTime() + 15 * 60 * 1000; // 15 minutes in ms

            const updateTimer = () => {
                const now = Date.now();
                const timeLeftMs = expiryTime - now;
                if (timeLeftMs <= 0) {
                    setQrTimeLeft(0);
                    clearInterval(qrTimer);
                    setQrTimer(null);
                    setGeneratedQR(null); // QR expired, clear it
                    setError("The previous QR code has expired.");
                } else {
                    setQrTimeLeft(Math.round(timeLeftMs / 1000));
                }
            };

            updateTimer(); // Initial update
            const intervalId = setInterval(updateTimer, 1000);
            setQrTimer(intervalId);

            // Cleanup function for this effect
            return () => {
                clearInterval(intervalId);
                setQrTimer(null);
            };
        } else {
            // Clear timer if no QR code is active
            if (qrTimer) clearInterval(qrTimer);
            setQrTimer(null);
            setQrTimeLeft(0);
        }
    }, [generatedQR]); // Run when generatedQR changes


    const handleGenerateQR = async () => {
        if (!selectedClassId) {
            setError("Please select a class first.");
            return;
        }
        setLoadingGenerate(true);
        setError(null);
        setSuccess(null);
        setGeneratedQR(null); // Clear previous QR
        if (qrTimer) clearInterval(qrTimer); // Clear previous timer

        try {
            const response = await generateQrCode(selectedClassId);
            setGeneratedQR(response.qr); // Store { QR_ID, Course_ID, Generated_Time, data_url }
            setSuccess(response.message || "QR code generated successfully!");
        } catch (err) {
            console.error("Failed to generate QR code:", err);
            setError(err.response?.data?.error || "Failed to generate QR code.");
        } finally {
            setLoadingGenerate(false);
        }
    };

    const handleSnackbarClose = () => {
        setSuccess(null);
    };

    // Format time for display (HH:MM)
    const formatDisplayTime = (timeString) => {
        if (!timeString) return 'N/A';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    }

    // Format time left for display (MM:SS)
    const formatTimeLeft = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    const selectedClassDetails = currentClasses.find(cls => cls.Course_ID === selectedClassId);

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Generate Attendance QR Code
            </Typography>

            {error && <ErrorAlert error={error} sx={{ mb: 2 }} />}
            <SuccessSnackbar open={!!success} message={success} onClose={handleSnackbarClose} />

            <Grid container spacing={3}>
                {/* Selection Card */}
                <Grid item xs={12} md={5}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Select Class
                            </Typography>
                            <FormControl fullWidth margin="normal" required disabled={loadingClasses || loadingGenerate}>
                                <InputLabel id="class-select-label">Currently Active Class</InputLabel>
                                <Select
                                    labelId="class-select-label"
                                    value={selectedClassId}
                                    label="Currently Active Class"
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                >
                                    {loadingClasses && <MenuItem value="" disabled><em>Loading classes...</em></MenuItem>}
                                    {!loadingClasses && currentClasses.length === 0 && <MenuItem value="" disabled><em>No active classes found</em></MenuItem>}
                                    {currentClasses.map((cls) => (
                                        <MenuItem key={cls.Timetable_ID} value={cls.Course_ID}>
                                            {cls.Course_Name} ({cls.Division_Name}) - {formatDisplayTime(cls.Start_Time)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {selectedClassDetails && (
                                <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                                    Room: {selectedClassDetails.Room_Number} | Time: {formatDisplayTime(selectedClassDetails.Start_Time)} - {formatDisplayTime(selectedClassDetails.End_Time)}
                                </Typography>
                            )}

                            <Button
                                variant="contained"
                                onClick={handleGenerateQR}
                                disabled={!selectedClassId || loadingGenerate || loadingClasses || !!generatedQR} // Disable if QR already generated
                                sx={{ mt: 2 }}
                                fullWidth
                            >
                                {loadingGenerate ? <CircularProgress size={24} /> : 'Generate QR Code'}
                            </Button>
                            {generatedQR && (
                                <Button
                                    variant="outlined"
                                    onClick={() => { setGeneratedQR(null); if (qrTimer) clearInterval(qrTimer); setQrTimeLeft(0); }} // Clear QR and timer
                                    sx={{ mt: 1 }}
                                    fullWidth
                                    color="secondary"
                                >
                                    Generate New Code
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* QR Code Display Card */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '250px', justifyContent: 'center' }}>
                        <CardContent sx={{ textAlign: 'center', width: '100%' }}>
                            {!generatedQR && (
                                <Typography color="text.secondary">
                                    Select a class and click "Generate QR Code" to display it here.
                                </Typography>
                            )}
                            {generatedQR && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="h6">
                                        Scan for: {currentClasses.find(c => c.Course_ID === generatedQR.Course_ID)?.Course_Name}
                                    </Typography>
                                    <QRCode
                                        value={generatedQR.QR_ID} // The data to encode (the unique QR ID)
                                        size={200} // Adjust size as needed
                                        level={"H"} // Error correction level
                                        includeMargin={true}
                                    />
                                    <Alert severity="info" variant='outlined' sx={{ mt: 1 }}>
                                        QR Code ID: {generatedQR.QR_ID} <br/>
                                        Expires in: <strong>{formatTimeLeft(qrTimeLeft)}</strong>
                                    </Alert>
                                    <Typography variant="caption" color="text.secondary">
                                        Students must scan this code using the attendance app within the time limit.
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeacherQRCodeGeneratorPage;