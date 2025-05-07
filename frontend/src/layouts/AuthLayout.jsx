// ========================================================================
// qr-attendance-frontend/src/layouts/AuthLayout.jsx
// ========================================================================
import React from 'react';
import { Outlet } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

const AuthLayout = () => {
    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                    QR Attendance
                </Typography>
                <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: '12px' }}>
                    <Outlet /> {/* Child routes (Login, Register) will render here */}
                </Paper>
            </Box>
        </Container>
    );
};

export default AuthLayout;
