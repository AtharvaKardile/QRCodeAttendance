// ========================================================================
// qr-attendance-frontend/src/pages/Teacher/TeacherTimetablePage.jsx
// ========================================================================
import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'; // Optional: If edit functionality is added
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import { getTeacherTimetable, createTimetableEntry, deleteTimetableEntry, getTeacherCourses } from '../../api/teacherApi';
import { getAllDivisions } from '../../api/commonApi';
import PageLoader from '../../components/UI/PageLoader';
import ErrorAlert from '../../components/UI/ErrorAlert';
import SuccessSnackbar from '../../components/UI/SuccessSnackbar';
import Grid from '@mui/material/Grid'; // Import the Grid component

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TeacherTimetablePage = () => {
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // State for Add/Edit Dialog
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogLoading, setDialogLoading] = useState(false);
    const [dialogError, setDialogError] = useState(null);
    const [formData, setFormData] = useState({
        Course_ID: '',
        Div_ID: '',
        Day_Of_Week: 'Monday',
        Start_Time: '', // Use 'HH:MM' format for input type="time"
        End_Time: '',   // Use 'HH:MM' format for input type="time"
        Room_Number: '',
    });
    const [availableCourses, setAvailableCourses] = useState([]);
    const [availableDivisions, setAvailableDivisions] = useState([]);

    // State for Delete Confirmation Dialog
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);


    // Fetch initial data
    const fetchTimetable = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getTeacherTimetable();
            setTimetable(data || []);
        } catch (err) {
            console.error("Failed to fetch timetable:", err);
            setError("Could not load your timetable. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimetable();
    }, []); // Fetch on mount

    // Fetch data needed for the dialog (courses, divisions)
    const fetchDialogData = async () => {
        setDialogLoading(true);
        setDialogError(null);
        try {
            const [coursesData, divisionsData] = await Promise.all([
                getTeacherCourses(), // Only courses the teacher teaches
                getAllDivisions()
            ]);
            setAvailableCourses(coursesData || []);
            setAvailableDivisions(divisionsData || []);
        } catch (err) {
            console.error("Failed to fetch data for form:", err);
            setDialogError("Could not load necessary data for the form.");
        } finally {
            setDialogLoading(false);
        }
    };

    // Dialog handlers
    const handleOpenDialog = () => {
        setFormData({ // Reset form data
            Course_ID: '', Div_ID: '', Day_Of_Week: 'Monday',
            Start_Time: '', End_Time: '', Room_Number: '',
        });
        setDialogError(null);
        fetchDialogData(); // Fetch courses/divisions when opening
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDialogSubmit = async () => {
        setDialogLoading(true);
        setDialogError(null);
        setSuccess(null);

        // Basic frontend validation (add more as needed)
        if (!formData.Course_ID || !formData.Div_ID || !formData.Day_Of_Week || !formData.Start_Time || !formData.End_Time || !formData.Room_Number) {
            setDialogError("Please fill in all fields.");
            setDialogLoading(false);
            return;
        }

        // Format time to HH:MM:SS if needed by backend (assuming input is HH:MM)
        const payload = {
            ...formData,
            Start_Time: `${formData.Start_Time}:00`,
            End_Time: `${formData.End_Time}:00`,
        };

        try {
            // TODO: Add logic for PUT request if editing an existing entry
            await createTimetableEntry(payload);
            setSuccess("Timetable entry created successfully!");
            handleCloseDialog();
            fetchTimetable(); // Refresh the timetable list
        } catch (err) {
            console.error("Failed to create timetable entry:", err);
            setDialogError(err.response?.data?.error || "Failed to create entry. Check for conflicts.");
        } finally {
            setDialogLoading(false);
        }
    };

    // Delete Confirmation Handlers
    const handleOpenDeleteConfirm = (entry) => {
        setEntryToDelete(entry);
        setOpenDeleteConfirm(true);
    };

    const handleCloseDeleteConfirm = () => {
        setEntryToDelete(null);
        setOpenDeleteConfirm(false);
    };

    const handleDeleteEntry = async () => {
        if (!entryToDelete) return;
        setDeleteLoading(true);
        setError(null); // Clear main page error
        setSuccess(null);
        try {
            await deleteTimetableEntry(entryToDelete.Timetable_ID);
            setSuccess("Timetable entry deleted successfully!");
            handleCloseDeleteConfirm();
            fetchTimetable(); // Refresh list
        } catch (err) {
            console.error("Failed to delete timetable entry:", err);
            // Show error on the main page as the dialog closes
            setError(err.response?.data?.error || "Failed to delete entry.");
            handleCloseDeleteConfirm(); // Still close the dialog
        } finally {
            setDeleteLoading(false);
        }
    };


    // Format time for display (HH:MM)
    const formatDisplayTime = (timeString) => {
        if (!timeString) return 'N/A';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    }

    const handleSnackbarClose = () => {
        setSuccess(null);
    };


    if (loading) {
        return <PageLoader />;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    My Timetable
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenDialog}
                >
                    Add Entry
                </Button>
            </Box>

            {error && <ErrorAlert error={error} sx={{ mb: 3 }} />}
            <SuccessSnackbar open={!!success} message={success} onClose={handleSnackbarClose} />

            <Card>
                <CardContent>
                    <TableContainer component={Paper} elevation={0} variant="outlined">
                        <Table sx={{ minWidth: 650 }} aria-label="timetable">
                            <TableHead sx={{ backgroundColor: 'grey.100' }}>
                                <TableRow>
                                    <TableCell>Day</TableCell>
                                    <TableCell>Time</TableCell>
                                    <TableCell>Course</TableCell>
                                    <TableCell>Division</TableCell>
                                    <TableCell>Room</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {timetable.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            Your timetable is empty. Add some entries!
                                        </TableCell>
                                    </TableRow>
                                )}
                                {timetable.map((entry) => (
                                    <TableRow
                                        key={entry.Timetable_ID}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell>{entry.Day_Of_Week}</TableCell>
                                        <TableCell>{formatDisplayTime(entry.Start_Time)} - {formatDisplayTime(entry.End_Time)}</TableCell>
                                        <TableCell>{entry.Course_Name}</TableCell>
                                        <TableCell>{entry.Division_Name}</TableCell>
                                        <TableCell>{entry.Room_Number}</TableCell>
                                        <TableCell align="right">
                                            {/* Optional Edit Button */}
                                            {/* <IconButton size="small" onClick={() => handleOpenEditDialog(entry)}>
                        <EditIcon fontSize="small" />
                      </IconButton> */}
                                            <IconButton size="small" onClick={() => handleOpenDeleteConfirm(entry)} color="error">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Add/Edit Timetable Entry Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Add New Timetable Entry</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Please fill in the details for the new class schedule. Ensure there are no time or room conflicts.
                    </DialogContentText>
                    {dialogError && <ErrorAlert error={dialogError} />}
                    {dialogLoading && !availableCourses.length && !availableDivisions.length && <PageLoader size={25} />}

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required margin="dense" disabled={dialogLoading}>
                                <InputLabel id="course-select-label">Course</InputLabel>
                                <Select
                                    labelId="course-select-label"
                                    id="Course_ID"
                                    name="Course_ID"
                                    value={formData.Course_ID}
                                    label="Course"
                                    onChange={handleFormChange}
                                >
                                    {availableCourses.map((course) => (
                                        <MenuItem key={course.Course_ID} value={course.Course_ID}>
                                            {course.Course_Name} ({course.Class_Year})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required margin="dense" disabled={dialogLoading}>
                                <InputLabel id="division-select-label">Division</InputLabel>
                                <Select
                                    labelId="division-select-label"
                                    id="Div_ID"
                                    name="Div_ID"
                                    value={formData.Div_ID}
                                    label="Division"
                                    onChange={handleFormChange}
                                >
                                    {availableDivisions.map((div) => (
                                        <MenuItem key={div.Div_ID} value={div.Div_ID}>
                                            {div.Name} ({div.Class_Year})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required margin="dense" disabled={dialogLoading}>
                                <InputLabel id="day-select-label">Day of Week</InputLabel>
                                <Select
                                    labelId="day-select-label"
                                    id="Day_Of_Week"
                                    name="Day_Of_Week"
                                    value={formData.Day_Of_Week}
                                    label="Day of Week"
                                    onChange={handleFormChange}
                                >
                                    {daysOfWeek.map((day) => (
                                        <MenuItem key={day} value={day}>{day}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                margin="dense"
                                id="Room_Number"
                                name="Room_Number"
                                label="Room Number"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={formData.Room_Number}
                                onChange={handleFormChange}
                                disabled={dialogLoading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                margin="dense"
                                id="Start_Time"
                                name="Start_Time"
                                label="Start Time"
                                type="time" // Use time input
                                fullWidth
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ step: 300 }} // 5 min step (optional)
                                value={formData.Start_Time}
                                onChange={handleFormChange}
                                disabled={dialogLoading}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                margin="dense"
                                id="End_Time"
                                name="End_Time"
                                label="End Time"
                                type="time" // Use time input
                                fullWidth
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ step: 300 }} // 5 min step (optional)
                                value={formData.End_Time}
                                onChange={handleFormChange}
                                disabled={dialogLoading}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={dialogLoading}>Cancel</Button>
                    <Button onClick={handleDialogSubmit} variant="contained" disabled={dialogLoading}>
                        {dialogLoading ? <CircularProgress size={20} /> : 'Add Entry'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteConfirm}
                onClose={handleCloseDeleteConfirm}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the timetable entry for{' '}
                        <strong>{entryToDelete?.Course_Name}</strong> on{' '}
                        <strong>{entryToDelete?.Day_Of_Week}</strong> at{' '}
                        <strong>{formatDisplayTime(entryToDelete?.Start_Time)}</strong>?
                        This action cannot be undone.
                    </DialogContentText>
                    {/* Optional: Show error specific to delete action here */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteConfirm} disabled={deleteLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteEntry} color="error" autoFocus disabled={deleteLoading}>
                        {deleteLoading ? <CircularProgress size={20} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default TeacherTimetablePage;