
// ========================================================================
// qr-attendance-frontend/src/pages/Common/UnauthorizedPage.jsx
// ========================================================================
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../../ context/useAuth'; // To determine home page

const UnauthorizedPage = () => {
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
                <LockIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'error.main', mb: 2 }}>
                    Access Denied
                </Typography>
                <Typography variant="h6" component="h2" gutterBottom>
                    You do not have permission to access this page.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Please contact the administrator if you believe this is an error.
                </Typography>
                <Button
                    variant="contained"
                    component={RouterLink}
                    to={homePath} // Link to appropriate home/dashboard
                >
                    Return to Dashboard
                </Button>
            </Box>
        </Container>
    );
};

export default UnauthorizedPage;
