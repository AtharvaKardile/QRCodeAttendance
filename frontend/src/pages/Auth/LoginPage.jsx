// ========================================================================
// qr-attendance-frontend/src/pages/Auth/LoginPage.jsx
// ========================================================================
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
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
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../../ context/useAuth.js';
import { loginStudent, loginTeacher } from '../../api/authApi';
import ErrorAlert from '../../components/UI/ErrorAlert'; // Import ErrorAlert

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student'); // Default role
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Get the location to redirect to after login
    const from = location.state?.from?.pathname || (role === 'teacher' ? "/teacher" : "/student");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null); // Clear previous errors

        try {
            let response;
            let credentials = { Password: password }; // Initialize with the common field

            if (role === 'student') {
                credentials.Email_ID = email; // Add Email_ID for students
                response = await loginStudent(credentials);
                login({ ...response.student, type: 'student' });
            } else {
                credentials.Email = email; // Add Email for teachers
                response = await loginTeacher(credentials);
                login({ ...response.teacher, type: 'teacher' });
            }

            console.log('Login successful:', response.message);
            navigate(from, { replace: true }); // Redirect to original destination or dashboard

        } catch (err) {
            console.error('Login failed:', err);
            setError(err.response?.data?.error || 'Login failed'); // Extract error message if available
            setPassword(''); // Clear password field on error
        } finally {
            setLoading(false);
        }
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
                Sign in
            </Typography>
            {error && <ErrorAlert error={error} />} {/* Display error */}
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <FormLabel component="legend">Login as:</FormLabel>
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
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />
                {/* Remember Me checkbox - Optional */}
                {/* <FormControlLabel
          control={<Checkbox value="remember" color="primary" />}
          label="Remember me"
        /> */}
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                </Button>
                <Grid container>
                    {/* Forgot password link - Optional */}
                    {/* <Grid item xs>
            <Link href="#" variant="body2">
              Forgot password?
            </Link>
          </Grid> */}
                    <Grid item>
                        <Link component={RouterLink} to="/register" variant="body2">
                            {"Don't have an account? Sign Up"}
                        </Link>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default LoginPage;