// ========================================================================
// qr-attendance-frontend/src/theme/theme.js
// ========================================================================
import { createTheme } from '@mui/material/styles';

// Create a theme instance.
const theme = createTheme({
    palette: {
        primary: {
            main: '#556cd6', // Example primary color
        },
        secondary: {
            main: '#19857b', // Example secondary color
        },
        error: {
            // main: '#red', // Invalid hex code - Corrected below
            main: '#f44336', // Standard MUI red 500
        },
        background: {
            default: '#f4f6f8', // Default background for pages
            paper: '#ffffff', // Background for elements like Card, Paper
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h5: {
            fontWeight: 500,
        },
        h6: {
            fontWeight: 500,
        },
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: 'none', // Cleaner look for the app bar
                    borderBottom: '1px solid #e0e0e0',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '12px', // Rounded corners for cards
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', // Subtle shadow
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px', // Rounded buttons
                    textTransform: 'none', // Prevent uppercase transformation
                }
            }
        }
    },
});

export default theme;
