// ========================================================================
// qr-attendance-frontend/src/components/UI/SuccessSnackbar.jsx
// ========================================================================
import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const SuccessSnackbar = ({ open, message, onClose, duration = 6000 }) => {
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        onClose(); // Call the onClose function passed from the parent
    };

    return (
        <Snackbar open={open} autoHideDuration={duration} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    );
};

export default SuccessSnackbar;
