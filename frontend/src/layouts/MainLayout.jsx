// ========================================================================
// qr-attendance-frontend/src/layouts/MainLayout.jsx
// ========================================================================
import React from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Header from '../components/Navigation/Header';
// import Sidebar from '../components/Navigation/Sidebar'; // Uncomment if using Sidebar

const MainLayout = () => {
    // const [mobileOpen, setMobileOpen] = React.useState(false); // State for Sidebar toggle

    // const handleDrawerToggle = () => {
    //   setMobileOpen(!mobileOpen);
    // };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />
            <Header /* onDrawerToggle={handleDrawerToggle} */ /> {/* Pass toggle handler */}
            {/* <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} /> Uncomment if using Sidebar */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    p: 3,
                    width: '100%' // Adjust width if using a fixed Sidebar
                }}
            >
                <Toolbar /> {/* Necessary spacer for content below AppBar */}
                <Container maxWidth="lg"> {/* Adjust maxWidth as needed */}
                    <Outlet /> {/* Child routes will render here */}
                </Container>
            </Box>
        </Box>
    );
};

export default MainLayout;
