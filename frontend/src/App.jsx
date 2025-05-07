// ========================================================================
// qr-attendance-frontend/src/App.jsx
// ========================================================================
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { AuthProvider } from './ context/AuthContext';
import AppRoutes from './routes';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline /> {/* Normalize CSS */}
            <AuthProvider>
                <Router>
                    <AppRoutes /> {/* Define routes */}
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
