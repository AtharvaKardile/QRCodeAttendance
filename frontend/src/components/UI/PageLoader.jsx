// ========================================================================
// qr-attendance-frontend/src/components/UI/PageLoader.jsx
// ========================================================================
import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const PageLoader = ({ size = 40 }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '80vh', // Take up significant vertical space
                width: '100%',
            }}
        >
            <CircularProgress size={size} />
        </Box>
    );
};

export default PageLoader;
