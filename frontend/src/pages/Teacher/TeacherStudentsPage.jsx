// ========================================================================
// qr-attendance-frontend/src/pages/Teacher/TeacherStudentsPage.jsx
// ========================================================================
import React, { useState, useEffect, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import { getAllStudents } from '../../api/teacherApi';
import PageLoader from '../../components/UI/PageLoader';
import ErrorAlert from '../../components/UI/ErrorAlert';

const TeacherStudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getAllStudents();
                setStudents(data || []);
            } catch (err) {
                console.error("Failed to fetch students:", err);
                setError("Could not load student data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    // Memoized filtered students based on search term
    const filteredStudents = useMemo(() => {
        if (!searchTerm) {
            return students;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return students.filter(student =>
            (student.Name && student.Name.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (student.PRN && student.PRN.toString().toLowerCase().includes(lowerCaseSearchTerm)) || // Ensure PRN is string for includes
            (student.Email_ID && student.Email_ID.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }, [students, searchTerm]);

    // Pagination change handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page
    };

    // Calculate students for the current page
    const paginatedStudents = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return filteredStudents.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredStudents, page, rowsPerPage]);


    if (loading) {
        return <PageLoader />;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Manage Students
            </Typography>

            {error && <ErrorAlert error={error} sx={{ mb: 3 }} />}

            <Card>
                <CardContent>
                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search by Name, PRN, or Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        {/* Placeholder for Attendance Filter */}
                        {/* <FormControl sx={{ mt: 2, minWidth: 200 }}>...</FormControl> */}
                    </Box>

                    <TableContainer component={Paper} elevation={0} variant="outlined">
                        <Table sx={{ minWidth: 650 }} aria-label="students table">
                            <TableHead sx={{ backgroundColor: 'grey.100' }}>
                                <TableRow>
                                    <TableCell>PRN</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Division</TableCell>
                                    <TableCell>Class Year</TableCell>
                                    {/* Add Mobile Number if needed */}
                                    {/* <TableCell>Mobile</TableCell> */}
                                    {/* Add Actions column if needed */}
                                    {/* <TableCell>Actions</TableCell> */}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedStudents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            {searchTerm ? 'No students match your search.' : 'No students found.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {paginatedStudents.map((student) => (
                                    <TableRow
                                        key={student.PRN}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {student.PRN}
                                        </TableCell>
                                        <TableCell>{student.Name}</TableCell>
                                        <TableCell>{student.Email_ID}</TableCell>
                                        <TableCell>{student.Division_Name || 'N/A'}</TableCell>
                                        <TableCell>{student.Class_Year || 'N/A'}</TableCell>
                                        {/* <TableCell>{student.Mobile_Number}</TableCell> */}
                                        {/* Add Actions Cell */}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredStudents.length} // Total count based on filtered results
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </CardContent>
            </Card>
        </Box>
    );
};

export default TeacherStudentsPage;
