
// ========================================================================
// qr-attendance-frontend/src/components/Navigation/Header.jsx
// ========================================================================
import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu'; // If using a sidebar toggle
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { useAuth } from '../../ context/useAuth.js';

const Header = ({ onDrawerToggle }) => { // Accept toggle function if using Drawer
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        handleClose();
        await logout();
        navigate('/login'); // Redirect to login after logout
    };

    const handleProfile = () => {
        handleClose();
        // Navigate to profile page if you have one
        // navigate('/profile');
        console.log("Navigate to profile...");
    }

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'white', color: 'black' }}>
            <Toolbar>
                {/* Hamburger Menu Toggle - uncomment if using Sidebar */}
                {/* <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }} // Show only on small screens
        >
          <MenuIcon />
        </IconButton> */}

                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    <RouterLink to={isAuthenticated ? (user?.type === 'teacher' ? '/teacher' : '/student') : '/login'} style={{ textDecoration: 'none', color: 'inherit' }}>
                        QR Attendance System
                    </RouterLink>
                </Typography>

                {isAuthenticated && user && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ mr: 2, display: { xs: 'none', sm: 'block'} }}> {/* Hide name on extra small screens */}
                            Welcome, {user.Name}
                        </Typography>
                        {/* Navigation Links based on role */}
                        {user.type === 'student' && (
                            <>
                                <Button color="inherit" component={RouterLink} to="/student">Dashboard</Button>
                                <Button color="inherit" component={RouterLink} to="/student/attendance">My Attendance</Button>
                                {/* Add student-specific links */}
                            </>
                        )}
                        {user.type === 'teacher' && (
                            <>
                                <Button color="inherit" component={RouterLink} to="/teacher">Dashboard</Button>
                                <Button color="inherit" component={RouterLink} to="/teacher/students">Students</Button>
                                <Button color="inherit" component={RouterLink} to="/teacher/courses">Courses</Button>
                                <Button color="inherit" component={RouterLink} to="/teacher/timetable">Timetable</Button>
                                <Button color="inherit" component={RouterLink} to="/teacher/qr-generator">Generate QR</Button>
                                {/* Add teacher-specific links */}
                            </>
                        )}

                        {/* User Menu */}
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            color="inherit"
                        >
                            <AccountCircle />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            {/* <MenuItem onClick={handleProfile}>Profile</MenuItem> */}
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                    </Box>
                )}
                {!isAuthenticated && (
                    <Button color="inherit" component={RouterLink} to="/login">Login</Button>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Header;
