// ========================================================================
// qr-attendance-frontend/src/pages/Common/NotFoundPage.jsx
// ========================================================================
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import HomeIcon from '@mui/icons-material/Home';
import { useAuth } from '../../ context/useAuth'; // To determine home page

const NotFoundPage = () => {
    const { isAuthenticated, user } = useAuth();
    const homePath = isAuthenticated ? (user?.type === 'teacher' ? '/teacher' : '/student') : '/login';

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    py: 8,
                    minHeight: 'calc(100vh - 64px)', // Adjust based on header height
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                <Typography variant="h1" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                    404
                </Typography>
                <Typography variant="h5" component="h2" gutterBottom>
                    Oops! Page Not Found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Sorry, the page you are looking for does not exist or may have been moved.
                </Typography>
                <Button
                    variant="contained"
                    component={RouterLink}
                    to={homePath} // Link to appropriate home/dashboard
                    startIcon={<HomeIcon />}
                >
                    Go to Homepage
                </Button>
            </Box>
        </Container>
    );
};

export default NotFoundPage;
