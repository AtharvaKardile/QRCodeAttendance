// ========================================================================
// qr-attendance-frontend/src/components/UI/ErrorAlert.jsx
// ========================================================================
import React from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Collapse from '@mui/material/Collapse';

const ErrorAlert = ({ error, title = "Error" }) => {
    const [open, setOpen] = React.useState(true);

    React.useEffect(() => {
        setOpen(!!error); // Show if error exists, hide if error becomes null/undefined
    }, [error]);

    // Determine the message to display
    let message = 'An unexpected error occurred.';
    if (typeof error === 'string') {
        message = error;
    } else if (error?.response?.data?.error) {
        // Extract error from Axios response data if available
        message = error.response.data.error;
    } else if (error?.message) {
        message = error.message;
    }

    return (
        <Collapse in={open}>
            <Alert
                severity="error"
                onClose={() => setOpen(false)} // Allow user to close the alert
                sx={{ mb: 2, width: '100%' }} // Add margin bottom
            >
                <AlertTitle>{title}</AlertTitle>
                {message}
            </Alert>
        </Collapse>
    );
};

export default ErrorAlert;
