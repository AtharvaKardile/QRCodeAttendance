// ========================================================================
// qr-attendance-frontend/src/pages/Auth/RegisterPage.jsx
// ========================================================================
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';
import { registerStudent, registerTeacher } from '../../api/authApi';
import { getAllDivisions } from '../../api/commonApi'; // To fetch divisions for student registration
import ErrorAlert from '../../components/UI/ErrorAlert';
import SuccessSnackbar from '../../components/UI/SuccessSnackbar';

const RegisterPage = () => {
    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mobile, setMobile] = useState('');
    const [prn, setPrn] = useState(''); // Student only
    const [divisionId, setDivisionId] = useState(''); // Student only
    const [divisions, setDivisions] = useState([]); // For dropdown
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false); // Loading state for fetching divisions
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    // Fetch divisions when role is student
    useEffect(() => {
        if (role === 'student') {
            const fetchDivisions = async () => {
                setFormLoading(true);
                setError(null);
                try {
                    const data = await getAllDivisions();
                    setDivisions(data || []); // Ensure data is an array
                } catch (err) {
                    console.error("Failed to fetch divisions:", err);
                    setError("Could not load divisions. Please try again later.");
                    setDivisions([]); // Set to empty array on error
                } finally {
                    setFormLoading(false);
                }
            };
            fetchDivisions();
        } else {
            setDivisions([]); // Clear divisions if switching role away from student
            setDivisionId(''); // Reset selected division
        }
    }, [role]); // Re-run when role changes

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            let response;
            if (role === 'student') {
                if (!prn || !divisionId) {
                    setError("PRN and Division are required for students.");
                    setLoading(false);
                    return;
                }
                const studentData = { PRN: prn, Name: name, Mobile_Number: mobile, Email_ID: email, Password: password, Div_ID: divisionId };
                response = await registerStudent(studentData);
            } else { // Teacher registration
                const teacherData = { Name: name, Mobile_Number: mobile, Email: email, Password: password };
                // Check if backend supports teacher registration via API
                // If not, this will fail or should be disabled in the UI
                response = await registerTeacher(teacherData);
            }

            console.log('Registration successful:', response.message);
            setSuccess('Registration successful! Redirecting to login...');
            // Redirect to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000); // 2-second delay

        } catch (err) {
            console.error('Registration failed:', err);
            setError(err); // Set error state
        } finally {
            setLoading(false);
        }
    };

    const handleSnackbarClose = () => {
        setSuccess(null);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
                Sign up
            </Typography>
            {error && <ErrorAlert error={error} />}
            <SuccessSnackbar open={!!success} message={success} onClose={handleSnackbarClose} />
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <FormLabel component="legend">Register as:</FormLabel>
                    <RadioGroup
                        row
                        aria-label="role"
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <FormControlLabel value="student" control={<Radio />} label="Student" />
                        <FormControlLabel value="teacher" control={<Radio />} label="Teacher" />
                    </RadioGroup>
                </FormControl>

                {/* Common Fields */}
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="name"
                    label="Full Name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="mobile"
                    label="Mobile Number"
                    name="mobile"
                    autoComplete="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    disabled={loading}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />

                {/* Student Specific Fields */}
                {role === 'student' && (
                    <>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="prn"
                            label="PRN (Student ID)"
                            name="prn"
                            value={prn}
                            onChange={(e) => setPrn(e.target.value)}
                            disabled={loading}
                        />
                        <FormControl fullWidth margin="normal" required disabled={loading || formLoading}>
                            <InputLabel id="division-select-label">Division</InputLabel>
                            <Select
                                labelId="division-select-label"
                                id="division-select"
                                value={divisionId}
                                label="Division"
                                onChange={(e) => setDivisionId(e.target.value)}
                            >
                                {formLoading && <MenuItem value="" disabled><em>Loading divisions...</em></MenuItem>}
                                {!formLoading && divisions.length === 0 && <MenuItem value="" disabled><em>No divisions available</em></MenuItem>}
                                {!formLoading && divisions.map((div) => (
                                    // Ensure div and div.Div_ID are defined
                                    div && div.Div_ID ? (
                                        <MenuItem key={div.Div_ID} value={div.Div_ID}>
                                            {div.Name} (Class: {div.Class_Year || 'N/A'})
                                        </MenuItem>
                                    ) : null
                                ))}
                            </Select>
                        </FormControl>
                    </>
                )}

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loading || formLoading}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
                </Button>
                <Grid container justifyContent="flex-end">
                    <Grid item>
                        <Link component={RouterLink} to="/login" variant="body2">
                            Already have an account? Sign in
                        </Link>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default RegisterPage;
