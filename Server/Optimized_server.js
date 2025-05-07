/**
 * Express.js Backend for QR Based Attendance System
 *
 * Features:
 * - JWT-based authentication with cookies for students and teachers.
 * - CRUD operations for Classes, Divisions, Courses, Students, Teachers.
 * - Timetable management for teachers.
 * - QR code generation linked to teacher's current schedule.
 * - Cookie-based attendance marking for students (no login needed after initial registration/login).
 * - Attendance reporting for students and teachers.
 * - Student device registration.
 * - Teacher admin access control.
 */

// ==================== IMPORTS ====================
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs
const cors = require('cors');
const qrcode = require('qrcode'); // For generating QR code images
const cookieParser = require('cookie-parser'); // To parse cookies
const jwt = require('jsonwebtoken'); // To handle JSON Web Tokens

// ==================== CONFIGURATION ====================
const app = express();

// --- Security Note: Store JWT_SECRET securely in environment variables ---
// Use a strong, unpredictable secret key.
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_VERY_STRONG_AND_SECRET_KEY_REPLACE_ME_IN_PRODUCTION'; // CHANGE THIS IN PRODUCTION

// --- CORS Configuration ---
// Adjust the origin to your frontend application's URL in production
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow frontend origin
    credentials: true, // Allow cookies to be sent with requests
    optionsSuccessStatus: 200
};

// --- Database Connection ---
// Use environment variables for database credentials in production
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'attendance_system'
});

// ==================== MIDDLEWARE ====================
app.use(cors(corsOptions)); // Enable CORS with options
app.use(cookieParser()); // Parse cookies attached to requests
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (if any)

// ==================== DATABASE CONNECTION & HELPERS ====================
db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err);
        process.exit(1); // Exit if DB connection fails on startup
    }
    console.log('✅ MySQL Connected Successfully');
});

/**
 * Helper function to execute MySQL queries using Promises.
 * @param {string} sql - The SQL query string.
 * @param {Array} [params=[]] - Optional array of parameters for prepared statements.
 * @returns {Promise<Array|object>} Promise resolving with query results or rejecting with error.
 */
function executeQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Database Query Error:', err.message);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// ==================== AUTHENTICATION MIDDLEWARE ====================

/**
 * Middleware to verify JWT token from cookies.
 * Attaches decoded user payload to `req.user` if valid.
 * Sends 401 if no token, 403 if token is invalid/expired.
 */
function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (token == null) {
        console.log('Authentication failed: No token provided.');
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
            return res.status(403).json({ error: 'Invalid or expired token. Please log in again.' });
        }
        req.user = user; // Contains payload like { PRN: ..., Email: ..., type: 'student'/'teacher', Is_Admin: true/false (for teachers) }
        console.log(`Authenticated user: ${user.Email || user.PRN} (${user.type}${user.Is_Admin ? ' - Admin' : ''})`);
        next();
    });
}

/**
 * Middleware to ensure the authenticated user is a student.
 * Must be used *after* `authenticateToken`.
 */
function requireStudent(req, res, next) {
    if (req.user && req.user.type === 'student') {
        next();
    } else {
        console.log(`Authorization failed: User ${req.user?.Email || req.user?.PRN} is not a student.`);
        res.status(403).json({ error: 'Access forbidden: Student privileges required.' });
    }
}

/**
 * Middleware to ensure the authenticated user is a teacher.
 * Must be used *after* `authenticateToken`.
 */
function requireTeacher(req, res, next) {
    if (req.user && req.user.type === 'teacher') {
        next();
    } else {
        console.log(`Authorization failed: User ${req.user?.Email || req.user?.PRN} is not a teacher.`);
        res.status(403).json({ error: 'Access forbidden: Teacher privileges required.' });
    }
}

/**
 * Middleware to ensure the authenticated user is an Admin Teacher.
 * Must be used *after* `authenticateToken`.
 */
function requireAdmin(req, res, next) {
    if (req.user && req.user.type === 'teacher' && req.user.Is_Admin === true) {
        next(); // User is an admin teacher, proceed
    } else {
        const userIdentifier = req.user?.Email || req.user?.PRN || 'Unknown user';
        const isAdminStatus = req.user?.Is_Admin;
        console.log(`Authorization failed for admin resource: User ${userIdentifier} (Type: ${req.user?.type}, Admin: ${isAdminStatus})`);
        res.status(403).json({ error: 'Access forbidden: Administrator privileges required.' });
    }
}


// ==================== UTILITY FUNCTIONS ====================

/**
 * Sets the JWT token cookie in the response.
 * @param {object} res - The Express response object.
 * @param {object} payload - The payload to include in the JWT.
 * @param {string} expiresIn - The token expiration time (e.g., '7d', '1h').
 * @param {number} maxAge - The cookie max age in milliseconds.
 */
function setAuthCookie(res, payload, expiresIn, maxAge) {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: maxAge
    });
}


// ==================== CLASS ROUTES ====================
// GET all classes
app.get('/api/classes', authenticateToken, async (req, res) => { // All authenticated users can view classes
    try {
        const classes = await executeQuery('SELECT * FROM class ORDER BY Year');
        res.status(200).json(classes);
    } catch (err) {
        console.error('Error fetching classes:', err);
        res.status(500).json({ error: 'Failed to fetch classes', details: err.message });
    }
});

// POST a new class (Admin-only route)
app.post('/api/classes', authenticateToken, requireAdmin, async (req, res) => {
    const { Class_ID, Year, No_Of_Students } = req.body;

    if (!Class_ID || !Year || No_Of_Students === undefined) { // check No_Of_Students for undefined as it can be 0
        return res.status(400).json({ error: 'Class ID, Year, and Number of Students are required' });
    }
    if (isNaN(parseInt(Year)) || isNaN(parseInt(No_Of_Students))) {
        return res.status(400).json({ error: 'Year and Number of Students must be numbers' });
    }

    try {
        await executeQuery(
            'INSERT INTO class (Class_ID, Year, No_Of_Students) VALUES (?, ?, ?)',
            [Class_ID, parseInt(Year), parseInt(No_Of_Students)]
        );
        res.status(201).json({ message: 'Class added successfully', Class_ID });
    } catch (err) {
        console.error('Error adding class:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: `Class with ID ${Class_ID} already exists.` });
        }
        res.status(500).json({ error: 'Failed to add class', details: err.message });
    }
});

// ==================== DIVISION ROUTES ====================
// GET all divisions with class info
app.get('/api/divisions', authenticateToken, async (req, res) => { // All authenticated users can view divisions
    try {
        const divisions = await executeQuery(`
      SELECT d.Div_ID, d.Name, d.Class_ID, c.Year as Class_Year
      FROM division d
      JOIN class c ON d.Class_ID = c.Class_ID
      ORDER BY c.Year, d.Name
    `);
        res.status(200).json(divisions);
    } catch (err) {
        console.error('Error fetching divisions:', err);
        res.status(500).json({ error: 'Failed to fetch divisions', details: err.message });
    }
});

// POST a new division (Admin-only route)
app.post('/api/divisions', authenticateToken, requireAdmin, async (req, res) => {
    const { Div_ID, Name, Class_ID } = req.body;

    if (!Div_ID || !Name || !Class_ID) {
        return res.status(400).json({ error: 'Division ID, Name, and Class ID are required' });
    }

    try {
        const classResult = await executeQuery('SELECT Class_ID FROM class WHERE Class_ID = ?', [Class_ID]);
        if (classResult.length === 0) {
            return res.status(400).json({ error: `Class with ID ${Class_ID} does not exist. Please create the class first.` });
        }

        await executeQuery(
            'INSERT INTO division (Div_ID, Name, Class_ID) VALUES (?, ?, ?)',
            [Div_ID, Name, Class_ID]
        );
        res.status(201).json({ message: 'Division added successfully', Div_ID });
    } catch (err) {
        console.error('Error adding division:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: `Division with ID ${Div_ID} already exists.` });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ error: `Class with ID ${Class_ID} does not exist.` });
        }
        res.status(500).json({ error: 'Failed to add division', details: err.message });
    }
});

// GET divisions by Class ID
app.get('/api/classes/:classId/divisions', authenticateToken, async (req, res) => {
    const { classId } = req.params;
    try {
        const divisions = await executeQuery(
            'SELECT * FROM division WHERE Class_ID = ? ORDER BY Name',
            [classId]
        );
        res.status(200).json(divisions); // Return empty array if no divisions, which is fine
    } catch (err) {
        console.error(`Error fetching divisions for class ${classId}:`, err);
        res.status(500).json({ error: 'Failed to fetch divisions for the class', details: err.message });
    }
});

// PUT update a division (Admin-only route)
app.put('/api/divisions/:divisionId', authenticateToken, requireAdmin, async (req, res) => {
    const { divisionId } = req.params;
    const { Name, Class_ID } = req.body;

    if (!Name || !Class_ID) {
        return res.status(400).json({ error: 'Name and Class ID are required for update' });
    }

    try {
        const classResult = await executeQuery('SELECT Class_ID FROM class WHERE Class_ID = ?', [Class_ID]);
        if (classResult.length === 0) {
            return res.status(400).json({ error: `Target Class with ID ${Class_ID} does not exist` });
        }

        const updateResult = await executeQuery(
            'UPDATE division SET Name = ?, Class_ID = ? WHERE Div_ID = ?',
            [Name, Class_ID, divisionId]
        );

        if (updateResult.affectedRows === 0) {
             return res.status(404).json({ error: `Division with ID ${divisionId} not found.` });
        }
        res.status(200).json({ message: 'Division updated successfully' });
    } catch (err) {
        console.error(`Error updating division ${divisionId}:`, err);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ error: `Target Class with ID ${Class_ID} does not exist.` });
        }
        res.status(500).json({ error: 'Failed to update division', details: err.message });
    }
});

// ==================== COURSE ROUTES ====================
// GET all courses with class info
app.get('/api/courses', authenticateToken, async (req, res) => { // All authenticated users can view courses
    try {
        const courses = await executeQuery(`
            SELECT c.Course_ID, c.Name as Course_Name, c.Class_ID, cl.Year as Class_Year
            FROM course c
            JOIN class cl ON c.Class_ID = cl.Class_ID
            ORDER BY cl.Year, c.Name
        `);
        res.status(200).json(courses);
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.status(500).json({ error: 'Failed to fetch courses', details: err.message });
    }
});

// POST a new course (Admin-only route)
app.post('/api/courses', authenticateToken, requireAdmin, async (req, res) => {
    const { Course_ID, Name, Class_ID } = req.body;

    if (!Course_ID || !Name || !Class_ID) {
        return res.status(400).json({ error: 'Course ID, Course Name, and Class ID are required' });
    }

    try {
        const classResult = await executeQuery('SELECT Class_ID FROM class WHERE Class_ID = ?', [Class_ID]);
        if (classResult.length === 0) {
            return res.status(400).json({ error: `Class with ID ${Class_ID} does not exist. Please create the class first.` });
        }

        await executeQuery(
            'INSERT INTO course (Course_ID, Name, Class_ID) VALUES (?, ?, ?)',
            [Course_ID, Name, Class_ID]
        );
        res.status(201).json({ message: 'Course added successfully', Course_ID });
    } catch (err) {
        console.error('Error adding course:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: `Course with ID ${Course_ID} already exists.` });
        }
         if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ error: `Class with ID ${Class_ID} does not exist.` });
        }
        res.status(500).json({ error: 'Failed to add course', details: err.message });
    }
});

// GET courses by Class ID
app.get('/api/classes/:classId/courses', authenticateToken, async (req, res) => {
    const { classId } = req.params;
    try {
        const courses = await executeQuery(
            'SELECT Course_ID, Name FROM course WHERE Class_ID = ? ORDER BY Name',
            [classId]
        );
        res.status(200).json(courses); // Return empty array if no courses, which is fine
    } catch (err) {
        console.error(`Error fetching courses for class ${classId}:`, err);
        res.status(500).json({ error: 'Failed to fetch courses for the class', details: err.message });
    }
});

// ==================== STUDENT ROUTES ====================
// GET all students with division and class info (Teacher/Admin route)
app.get('/api/students', authenticateToken, requireTeacher, async (req, res) => { // Teachers can view all students
    try {
        const students = await executeQuery(`
      SELECT s.PRN, s.Name, s.Mobile_Number, s.Email_ID, s.Div_ID, d.Name as Division_Name, c.Year as Class_Year
      FROM student s
      JOIN division d ON s.Div_ID = d.Div_ID
      JOIN class c ON d.Class_ID = c.Class_ID
      ORDER BY c.Year, d.Name, s.Name
    `);
        res.status(200).json(students);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: 'Failed to fetch students', details: err.message });
    }
});

// POST Register a new student
app.post('/api/students/register', async (req, res) => {
    console.log('Received student registration data:', req.body);
    const { PRN, Name, Mobile_Number, Email_ID, Password, Div_ID } = req.body;
    const userAgent = req.headers['user-agent']; // Capture User-Agent

    if (!PRN || !Name || !Mobile_Number || !Email_ID || !Password || !Div_ID) {
        console.log('Missing required student fields');
        return res.status(400).json({ error: 'Please provide all required fields (PRN, Name, Mobile, Email, Password, Division ID)' });
    }
    // Add more specific validation (e.g., email format, PRN format/type) if needed
    if (isNaN(parseInt(PRN))) {
        return res.status(400).json({ error: 'PRN must be a number.' });
    }


    try {
        // 1. Check if the Division_ID exists
        const divisionResult = await executeQuery('SELECT Div_ID FROM division WHERE Div_ID = ?', [Div_ID]);
        if (divisionResult.length === 0) {
            return res.status(400).json({ error: `Division with ID ${Div_ID} does not exist.` });
        }

        // 2. Check if student PRN, email, or mobile already exists
        const existingStudent = await executeQuery(
            'SELECT PRN FROM student WHERE PRN = ? OR Email_ID = ? OR Mobile_Number = ?',
            [PRN, Email_ID, Mobile_Number]
        );
        if (existingStudent.length > 0) {
            return res.status(409).json({ error: 'Student with this PRN, Email, or Mobile Number already exists.' });
        }

        // 3. Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(Password, saltRounds);

        // 4. Insert the new student
        await executeQuery(
            'INSERT INTO student (PRN, Name, Mobile_Number, Email_ID, Password, Div_ID) VALUES (?, ?, ?, ?, ?, ?)',
            [parseInt(PRN), Name, Mobile_Number, Email_ID, hashedPassword, Div_ID]
        );

        // 5. Register Student Device
        const deviceId = uuidv4();
        const registeredAt = new Date();
        await executeQuery(
            'INSERT INTO student_devices (Device_ID, Student_PRN, User_Agent, Registered_At, Last_Used) VALUES (?, ?, ?, ?, ?)',
            [deviceId, parseInt(PRN), userAgent, registeredAt, registeredAt]
        );
        console.log(`Device ${deviceId} registered for student ${PRN}.`);

        // 6. Generate JWT and set cookie
        const studentPayload = { PRN: parseInt(PRN), Email_ID: Email_ID, Name: Name, Div_ID: Div_ID, type: 'student' };
        const cookieMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        setAuthCookie(res, studentPayload, '7d', cookieMaxAge);
        console.log(`Student ${PRN} registered successfully and cookie set.`);

        res.status(201).json({
            message: 'Student registered successfully. Device registration initiated.',
            student: { PRN: parseInt(PRN), Name, Email_ID, Mobile_Number, Div_ID }
        });
    } catch (err) {
        console.error('Error registering student:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Student with this PRN, Email, or Mobile Number already exists.' });
        }
         if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ error: `Division with ID ${Div_ID} does not exist or other reference issue.` });
        }
        res.status(500).json({ error: 'Failed to register student', details: err.message });
    }
});

// POST Student login
app.post('/api/students/login', async (req, res) => {
    const { Email_ID, Password } = req.body; // Or PRN, depending on login preference

    if (!Email_ID || !Password) { // Adjust if using PRN for login
        return res.status(400).json({ error: 'Email and Password are required' });
    }

    try {
        const students = await executeQuery(
            'SELECT PRN, Name, Email_ID, Password, Div_ID FROM student WHERE Email_ID = ?', // Adjust if using PRN
            [Email_ID]
        );

        if (students.length === 0) {
            console.log(`Login attempt failed: Email ${Email_ID} not found.`);
            return res.status(401).json({ error: 'Invalid Email or Password' });
        }

        const student = students[0];
        const validPassword = await bcrypt.compare(Password, student.Password);

        if (!validPassword) {
            console.log(`Login attempt failed: Invalid password for Email ${Email_ID}.`);
            return res.status(401).json({ error: 'Invalid Email or Password' });
        }

        const studentPayload = { PRN: student.PRN, Email_ID: student.Email_ID, Name: student.Name, Div_ID: student.Div_ID, type: 'student' };
        const cookieMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        setAuthCookie(res, studentPayload, '7d', cookieMaxAge);

        console.log(`Student ${student.PRN} logged in successfully.`);
        res.status(200).json({
            message: 'Login successful',
            student: { PRN: student.PRN, Name: student.Name, Email_ID: student.Email_ID, Div_ID: student.Div_ID }
        });
    } catch (err) {
        console.error('Error during student login:', err);
        res.status(500).json({ error: 'Server error during login', details: err.message });
    }
});

// GET Logout User (Student or Teacher)
app.post('/api/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    console.log('User logged out.');
    res.status(200).json({ message: 'Logout successful' });
});

// GET courses for a specific student (Requires student login)
app.get('/api/students/my-courses', authenticateToken, requireStudent, async (req, res) => {
    const studentPRN = req.user.PRN;

    try {
        const courses = await executeQuery(`
            SELECT c.Course_ID, c.Name as Course_Name, cl.Year as Class_Year
            FROM course c
            JOIN student_course sc ON c.Course_ID = sc.Course_ID
            JOIN class cl ON c.Class_ID = cl.Class_ID
            WHERE sc.PRN = ?
            ORDER BY cl.Year, c.Name
        `, [studentPRN]);
        res.status(200).json(courses);
    } catch (err) {
        console.error(`Error fetching courses for student ${studentPRN}:`, err);
        res.status(500).json({ error: 'Failed to fetch your courses', details: err.message });
    }
});

// POST Assign student to a course (Teacher route)
app.post('/api/students/:prn/courses', authenticateToken, requireTeacher, async (req, res) => {
    const { prn } = req.params;
    const { Course_ID } = req.body;

    if (!Course_ID) {
        return res.status(400).json({ error: 'Course ID is required' });
    }
    if (isNaN(parseInt(prn))) {
         return res.status(400).json({ error: 'Invalid student PRN format' });
    }

    try {
        const studentResult = await executeQuery('SELECT PRN FROM student WHERE PRN = ?', [parseInt(prn)]);
        if (studentResult.length === 0) {
            return res.status(404).json({ error: `Student with PRN ${prn} not found` });
        }

        const courseResult = await executeQuery('SELECT Course_ID FROM course WHERE Course_ID = ?', [Course_ID]);
        if (courseResult.length === 0) {
            return res.status(404).json({ error: `Course with ID ${Course_ID} not found` });
        }

        const existingAssignment = await executeQuery(
            'SELECT PRN FROM student_course WHERE PRN = ? AND Course_ID = ?',
            [parseInt(prn), Course_ID]
        );
        if (existingAssignment.length > 0) {
            return res.status(409).json({ error: 'Student is already assigned to this course' });
        }

        await executeQuery(
            'INSERT INTO student_course (PRN, Course_ID) VALUES (?, ?)',
            [parseInt(prn), Course_ID]
        );
        res.status(201).json({ message: 'Student assigned to course successfully' });
    } catch (err) {
        console.error(`Error assigning student ${prn} to course ${Course_ID}:`, err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Student is already assigned to this course' });
        }
         if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(404).json({ error: `Student (PRN: ${prn}) or Course (ID: ${Course_ID}) not found.` });
        }
        res.status(500).json({ error: 'Failed to assign student to course', details: err.message });
    }
});

// GET attendance summary for the logged-in student
app.get('/api/students/my-attendance', authenticateToken, requireStudent, async (req, res) => {
    const studentPRN = req.user.PRN;

    try {
        const attendanceSummary = await executeQuery(`
            SELECT
                c.Course_ID,
                c.Name AS Course_Name,
                COUNT(DISTINCT qr.QR_ID) AS Total_Classes_Held,
                SUM(CASE WHEN a.Status = TRUE THEN 1 ELSE 0 END) AS Classes_Attended,
                IFNULL(
                    (SUM(CASE WHEN a.Status = TRUE THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT qr.QR_ID), 0)) * 100,
                    0
                ) AS Attendance_Percentage
            FROM student s
            JOIN student_course sc ON s.PRN = sc.PRN
            JOIN course c ON sc.Course_ID = c.Course_ID
            LEFT JOIN QR_code qr ON c.Course_ID = qr.Course_ID
            LEFT JOIN attendance a ON s.PRN = a.PRN AND qr.QR_ID = a.QR_ID
            WHERE s.PRN = ?
            GROUP BY c.Course_ID, c.Name
            ORDER BY c.Name;
        `, [studentPRN]);
        res.status(200).json(attendanceSummary);
    } catch (err) {
        console.error(`Error fetching attendance summary for student ${studentPRN}:`, err);
        res.status(500).json({ error: 'Failed to fetch your attendance summary', details: err.message });
    }
});


// ==================== TEACHER ROUTES ====================
// GET all teachers (Admin route)
app.get('/api/teachers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const teachers = await executeQuery(
            'SELECT Email, Name, Mobile_Number, Is_Admin FROM teacher ORDER BY Name' // Added Is_Admin
        );
        res.status(200).json(teachers);
    } catch (err) {
        console.error('Error fetching teachers:', err);
        res.status(500).json({ error: 'Failed to fetch teachers', details: err.message });
    }
});

// POST Register a new teacher (Admin-only route)
app.post('/api/teachers/register', authenticateToken, requireAdmin, async (req, res) => {
    const { Email, Name, Password, Mobile_Number, Is_Admin } = req.body;

    if (!Email || !Name || !Password || !Mobile_Number) {
        return res.status(400).json({ error: 'Email, Name, Password, and Mobile Number are required' });
    }
    // Add email format validation etc.

    try {
        const existingTeacher = await executeQuery(
            'SELECT Email FROM teacher WHERE Email = ? OR Mobile_Number = ?',
            [Email, Mobile_Number]
        );
        if (existingTeacher.length > 0) {
            return res.status(409).json({ error: 'Teacher with this Email or Mobile Number already exists.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(Password, saltRounds);
        const isAdminValue = Is_Admin === true; // Ensure boolean, respects schema default if Is_Admin is not sent

        await executeQuery(
            'INSERT INTO teacher (Email, Name, Password, Mobile_Number, Is_Admin) VALUES (?, ?, ?, ?, ?)',
            [Email, Name, hashedPassword, Mobile_Number, isAdminValue]
        );

        // Fetch the newly created teacher to get the actual Is_Admin value (respecting DB default)
        const newTeacherResult = await executeQuery('SELECT Email, Name, Mobile_Number, Is_Admin FROM teacher WHERE Email = ?', [Email]);
        if (newTeacherResult.length === 0) {
             console.error(`Failed to retrieve newly created teacher: ${Email}`);
             // Don't set cookie if teacher retrieval failed, but registration might have succeeded.
             // This scenario should be unlikely if INSERT was successful.
             return res.status(201).json({
                message: 'Teacher registered, but failed to retrieve full details for immediate session. Please log in.',
                teacher: { Email, Name, Mobile_Number, Is_Admin: isAdminValue } // Send what we have
            });
        }
        const newTeacher = newTeacherResult[0];

        // For immediate login after registration (optional, or require them to login separately)
        const teacherPayload = { Email: newTeacher.Email, Name: newTeacher.Name, type: 'teacher', Is_Admin: newTeacher.Is_Admin };
        const cookieMaxAge = 24 * 60 * 60 * 1000; // 1 day
        setAuthCookie(res, teacherPayload, '1d', cookieMaxAge);

        console.log(`Teacher ${newTeacher.Email} (Admin: ${newTeacher.Is_Admin}) registered successfully by ${req.user.Email}.`);
        res.status(201).json({
            message: 'Teacher registered successfully',
            teacher: { Email: newTeacher.Email, Name: newTeacher.Name, Mobile_Number: newTeacher.Mobile_Number, Is_Admin: newTeacher.Is_Admin }
        });
    } catch (err) {
        console.error('Error registering teacher:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Teacher with this Email or Mobile Number already exists.' });
        }
        res.status(500).json({ error: 'Failed to register teacher', details: err.message });
    }
});

// POST Teacher login
app.post('/api/teachers/login', async (req, res) => {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
        return res.status(400).json({ error: 'Email and Password are required' });
    }

    try {
        const teachers = await executeQuery(
            'SELECT Email, Name, Password, Mobile_Number, Is_Admin FROM teacher WHERE Email = ?',
            [Email]
        );

        if (teachers.length === 0) {
            console.log(`Login attempt failed: Teacher Email ${Email} not found.`);
            return res.status(401).json({ error: 'Invalid Email or Password' });
        }

        const teacher = teachers[0];
        const validPassword = await bcrypt.compare(Password, teacher.Password);

        if (!validPassword) {
             console.log(`Login attempt failed: Invalid password for Teacher Email ${Email}.`);
            return res.status(401).json({ error: 'Invalid Email or Password' });
        }

        const teacherPayload = { Email: teacher.Email, Name: teacher.Name, type: 'teacher', Is_Admin: teacher.Is_Admin };
        const cookieMaxAge = 24 * 60 * 60 * 1000; // 1 day
        setAuthCookie(res, teacherPayload, '1d', cookieMaxAge);

        console.log(`Teacher ${teacher.Email} (Admin: ${teacher.Is_Admin}) logged in successfully.`);
        res.status(200).json({
            message: 'Login successful',
            teacher: { Email: teacher.Email, Name: teacher.Name, Mobile_Number: teacher.Mobile_Number, Is_Admin: teacher.Is_Admin }
        });
    } catch (err) {
        console.error('Error during teacher login:', err);
        res.status(500).json({ error: 'Server error during login', details: err.message });
    }
});

// GET all students enrolled in courses taught by the logged-in teacher
app.get('/api/teachers/my-students', authenticateToken, requireTeacher, async (req, res) => {
    const teacherEmail = req.user.Email;

    try {
        const students = await executeQuery(`
            SELECT DISTINCT s.PRN, s.Name, s.Email_ID, s.Mobile_Number, d.Name AS Division_Name, c.Year as Class_Year
            FROM student s
            JOIN division d ON s.Div_ID = d.Div_ID
            JOIN class c ON d.Class_ID = c.Class_ID
            JOIN student_course sc ON s.PRN = sc.PRN
            JOIN teacher_course tc ON sc.Course_ID = tc.Course_ID
            WHERE tc.Teacher_Email = ?
            ORDER BY c.Year, d.Name, s.Name
        `, [teacherEmail]);
        res.status(200).json(students);
    } catch (err) {
        console.error(`Error fetching students for teacher ${teacherEmail}:`, err);
        res.status(500).json({ error: 'Failed to fetch students for your courses', details: err.message });
    }
});

// GET courses taught by the logged-in teacher
app.get('/api/teachers/my-courses', authenticateToken, requireTeacher, async (req, res) => {
    const teacherEmail = req.user.Email;

    try {
        const courses = await executeQuery(`
            SELECT c.Course_ID, c.Name as Course_Name, cl.Year as Class_Year
            FROM course c
            JOIN teacher_course tc ON c.Course_ID = tc.Course_ID
            JOIN class cl ON c.Class_ID = cl.Class_ID
            WHERE tc.Teacher_Email = ?
            ORDER BY cl.Year, c.Name
        `, [teacherEmail]);
        res.status(200).json(courses);
    } catch (err) {
        console.error(`Error fetching courses for teacher ${teacherEmail}:`, err);
        res.status(500).json({ error: 'Failed to fetch your assigned courses', details: err.message });
    }
});

// POST Assign logged-in teacher to a course (Teacher can assign themselves, or Admin can assign any teacher)
// For simplicity, keeping it as teacher self-assign. Admin assigning other teachers would need a different route or logic.
app.post('/api/teachers/my-courses', authenticateToken, requireTeacher, async (req, res) => {
    const teacherEmail = req.user.Email;
    const { Course_ID } = req.body;

    if (!Course_ID) {
        return res.status(400).json({ error: 'Course ID is required' });
    }

    try {
        const courseResult = await executeQuery('SELECT Course_ID FROM course WHERE Course_ID = ?', [Course_ID]);
        if (courseResult.length === 0) {
            return res.status(404).json({ error: `Course with ID ${Course_ID} not found` });
        }

        const existingAssignment = await executeQuery(
            'SELECT Teacher_Email FROM teacher_course WHERE Teacher_Email = ? AND Course_ID = ?',
            [teacherEmail, Course_ID]
        );
        if (existingAssignment.length > 0) {
            return res.status(409).json({ error: 'You are already assigned to this course' });
        }

        await executeQuery(
            'INSERT INTO teacher_course (Teacher_Email, Course_ID) VALUES (?, ?)',
            [teacherEmail, Course_ID]
        );
        res.status(201).json({ message: 'Successfully assigned to course' });
    } catch (err) {
        console.error(`Error assigning teacher ${teacherEmail} to course ${Course_ID}:`, err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'You are already assigned to this course' });
        }
         if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(404).json({ error: `Course (ID: ${Course_ID}) not found.` });
        }
        res.status(500).json({ error: 'Failed to assign teacher to course', details: err.message });
    }
});

// GET detailed attendance report for a specific course taught by the logged-in teacher
app.get('/api/teachers/my-courses/:courseId/attendance', authenticateToken, requireTeacher, async (req, res) => {
    const teacherEmail = req.user.Email;
    const { courseId } = req.params;

    try {
        const teacherCourse = await executeQuery(
            'SELECT Teacher_Email FROM teacher_course WHERE Teacher_Email = ? AND Course_ID = ?',
            [teacherEmail, courseId]
        );
        if (teacherCourse.length === 0) {
            console.log(`Authorization failed: Teacher ${teacherEmail} tried to access attendance for unassigned course ${courseId}`);
            return res.status(403).json({ error: 'You are not authorized to view attendance for this course.' });
        }

        const attendanceReport = await executeQuery(`
            SELECT
                s.PRN,
                s.Name AS Student_Name,
                d.Name AS Division_Name,
                COUNT(DISTINCT qr.QR_ID) AS Total_Classes_Held,
                SUM(CASE WHEN a.Status = TRUE THEN 1 ELSE 0 END) AS Classes_Attended,
                IFNULL(
                    (SUM(CASE WHEN a.Status = TRUE THEN 1 ELSE 0 END) / NULLIF(COUNT(DISTINCT qr.QR_ID), 0)) * 100,
                    0
                ) AS Attendance_Percentage
            FROM student s
            JOIN division d ON s.Div_ID = d.Div_ID
            JOIN student_course sc ON s.PRN = sc.PRN AND sc.Course_ID = ?
            LEFT JOIN QR_code qr ON sc.Course_ID = qr.Course_ID
            LEFT JOIN attendance a ON s.PRN = a.PRN AND qr.QR_ID = a.QR_ID
            WHERE sc.Course_ID = ?
            GROUP BY s.PRN, s.Name, d.Name
            ORDER BY Attendance_Percentage DESC, s.Name;
        `, [courseId, courseId]);
        res.status(200).json(attendanceReport);
    } catch (err) {
        console.error(`Error fetching attendance report for course ${courseId} by teacher ${teacherEmail}:`, err);
        res.status(500).json({ error: 'Failed to fetch attendance report', details: err.message });
    }
});

// ==================== TIMETABLE ROUTES ====================

// POST Create a new timetable entry (Requires Teacher role)
app.post('/api/timetables', authenticateToken, requireTeacher, async (req, res) => {
    const { Course_ID, Div_ID, Day_Of_Week, Start_Time, End_Time, Room_Number } = req.body;
    const teacherEmail = req.user.Email;

    if (!Course_ID || !Div_ID || !Day_Of_Week || !Start_Time || !End_Time || !Room_Number) {
        return res.status(400).json({ error: 'Missing required timetable fields (Course, Division, Day, Start Time, End Time, Room)' });
    }
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(Day_Of_Week)) {
        return res.status(400).json({ error: `Invalid Day_Of_Week: ${Day_Of_Week}. Must be one of ${validDays.join(', ')}` });
    }
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timeRegex.test(Start_Time) || !timeRegex.test(End_Time)) {
        return res.status(400).json({ error: 'Invalid time format. Use HH:MM or HH:MM:SS.' });
    }
    if (End_Time <= Start_Time) {
        return res.status(400).json({ error: 'End Time must be after Start Time.' });
    }

    try {
         const teacherCourse = await executeQuery(
            'SELECT Teacher_Email FROM teacher_course WHERE Teacher_Email = ? AND Course_ID = ?',
            [teacherEmail, Course_ID]
        );
        if (teacherCourse.length === 0) {
            return res.status(403).json({ error: `You are not assigned to teach Course ID ${Course_ID}. Cannot create timetable entry.` });
        }

        // Check for room conflicts
        const roomConflicts = await executeQuery(
            `SELECT Timetable_ID FROM timetable
             WHERE Room_Number = ? AND Day_Of_Week = ? AND
                   NOT (? <= Start_Time OR ? >= End_Time)`,
            [Room_Number, Day_Of_Week, End_Time, Start_Time] // Corrected overlap logic: new_end_time, new_start_time
        );
        if (roomConflicts.length > 0) {
            return res.status(409).json({ error: 'Scheduling conflict: Room is already booked at an overlapping time on this day.' });
        }

        // Check for teacher conflicts
         const teacherConflicts = await executeQuery(
            `SELECT Timetable_ID FROM timetable
             WHERE Teacher_Email = ? AND Day_Of_Week = ? AND
                   NOT (? <= Start_Time OR ? >= End_Time)`,
            [teacherEmail, Day_Of_Week, End_Time, Start_Time] // Corrected overlap logic
        );
        if (teacherConflicts.length > 0) {
            return res.status(409).json({ error: 'Scheduling conflict: You are already scheduled for another class at an overlapping time on this day.' });
        }

        const Timetable_ID = uuidv4();
        await executeQuery(
            `INSERT INTO timetable (Timetable_ID, Course_ID, Div_ID, Teacher_Email, Day_Of_Week, Start_Time, End_Time, Room_Number)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [Timetable_ID, Course_ID, Div_ID, teacherEmail, Day_Of_Week, Start_Time, End_Time, Room_Number]
        );
        res.status(201).json({ message: 'Timetable entry created successfully', Timetable_ID });

    } catch (err) {
        console.error('Error creating timetable entry:', err);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Invalid Course ID, Division ID, or Teacher Email provided.' });
        }
         if (err.code === 'ER_DUP_ENTRY' || err.message.includes('unique_class_time')) { // MySQL unique constraint name might be in error message
             return res.status(409).json({ error: 'Scheduling conflict based on unique constraints (e.g., Division, Day, Start Time, Room).' });
        }
        res.status(500).json({ error: 'Failed to create timetable entry', details: err.message });
    }
});

// GET timetable for the logged-in teacher
app.get('/api/teachers/my-timetable', authenticateToken, requireTeacher, async (req, res) => {
    const teacherEmail = req.user.Email;

    try {
        const timetable = await executeQuery(`
            SELECT tt.Timetable_ID, tt.Course_ID, c.Name as Course_Name, tt.Div_ID, d.Name as Division_Name,
                   tt.Day_Of_Week, tt.Start_Time, tt.End_Time, tt.Room_Number
            FROM timetable tt
            JOIN course c ON tt.Course_ID = c.Course_ID
            JOIN division d ON tt.Div_ID = d.Div_ID
            WHERE tt.Teacher_Email = ?
            ORDER BY FIELD(tt.Day_Of_Week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), tt.Start_Time
        `, [teacherEmail]);
        res.status(200).json(timetable);
    } catch (err) {
        console.error(`Error fetching timetable for teacher ${teacherEmail}:`, err);
        res.status(500).json({ error: 'Failed to fetch your timetable', details: err.message });
    }
});

// GET currently scheduled classes for the logged-in teacher
app.get('/api/teachers/my-current-classes', authenticateToken, requireTeacher, async (req, res) => {
    const teacherEmail = req.user.Email;

    try {
        const now = new Date();
        const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

        console.log(`Checking current classes for ${teacherEmail} at ${dayOfWeek} ${currentTime}`);

        const currentClasses = await executeQuery(`
            SELECT tt.Timetable_ID, tt.Course_ID, c.Name as Course_Name, tt.Div_ID, d.Name as Division_Name, tt.Teacher_Email, tt.Room_Number, tt.Start_Time, tt.End_Time
            FROM timetable tt
            JOIN course c ON tt.Course_ID = c.Course_ID
            JOIN division d ON tt.Div_ID = d.Div_ID
            WHERE tt.Teacher_Email = ? AND tt.Day_Of_Week = ?
              AND tt.Start_Time <= ? AND tt.End_Time > ?
            ORDER BY tt.Start_Time
        `, [teacherEmail, dayOfWeek, currentTime, currentTime]);

        if (currentClasses.length === 0) {
             console.log(`No current classes found for ${teacherEmail}.`);
        } else {
            console.log(`Found ${currentClasses.length} current class(es) for ${teacherEmail}.`);
        }
        res.status(200).json(currentClasses); // Send empty array if no classes
    } catch (err) {
        console.error(`Error fetching current classes for teacher ${teacherEmail}:`, err);
        res.status(500).json({ error: 'Failed to fetch currently scheduled classes', details: err.message });
    }
});

// DELETE a timetable entry (Requires Teacher role and ownership)
app.delete('/api/timetables/:timetableId', authenticateToken, requireTeacher, async (req, res) => {
    const { timetableId } = req.params;
    const teacherEmail = req.user.Email;

    if (!timetableId) {
         return res.status(400).json({ error: 'Timetable ID is required in the URL.' });
    }

    try {
         const entry = await executeQuery(
            'SELECT Teacher_Email FROM timetable WHERE Timetable_ID = ?',
            [timetableId]
        );

        if (entry.length === 0) {
            return res.status(404).json({ error: 'Timetable entry not found.' });
        }
        if (entry[0].Teacher_Email !== teacherEmail && !req.user.Is_Admin) { // Admin can delete any
            console.log(`Authorization failed: Teacher ${teacherEmail} (not admin) tried to delete timetable entry ${timetableId} owned by ${entry[0].Teacher_Email}`);
            return res.status(403).json({ error: 'Forbidden: You can only delete your own timetable entries unless you are an administrator.' });
        }

        const deleteResult = await executeQuery('DELETE FROM timetable WHERE Timetable_ID = ?', [timetableId]);
        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ error: 'Timetable entry not found (deletion failed).' });
        }
        console.log(`Timetable entry ${timetableId} deleted by ${teacherEmail} (Admin: ${req.user.Is_Admin}).`);
        res.status(200).json({ message: 'Timetable entry deleted successfully.' });
    } catch (err) {
        console.error(`Error deleting timetable entry ${timetableId}:`, err);
        res.status(500).json({ error: 'Failed to delete timetable entry', details: err.message });
    }
});


// ==================== QR CODE & ATTENDANCE ROUTES ====================

// POST Generate QR code for attendance (Requires Teacher role)
app.post('/api/qr/generate', authenticateToken, requireTeacher, async (req, res) => {
    const { Course_ID } = req.body;
    const teacherEmail = req.user.Email;

    if (!Course_ID) {
        return res.status(400).json({ error: 'Course ID is required (must be from a currently scheduled class)' });
    }

    try {
        const now = new Date();
        const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = now.toTimeString().split(' ')[0];

        const currentClassCheck = await executeQuery(`
            SELECT Timetable_ID FROM timetable
            WHERE Teacher_Email = ? AND Course_ID = ? AND Day_Of_Week = ?
              AND Start_Time <= ? AND End_Time > ?
        `, [teacherEmail, Course_ID, dayOfWeek, currentTime, currentTime]);

        if (currentClassCheck.length === 0) {
            console.log(`QR generation failed: Course ${Course_ID} is not currently scheduled for teacher ${teacherEmail}.`);
            return res.status(403).json({ error: 'Cannot generate QR code: This course is not currently scheduled for you or does not exist in timetable.' });
        }

        const QR_ID = uuidv4();
        const generatedTime = new Date();

        await executeQuery(
            'INSERT INTO QR_code (QR_ID, Generated_Time, Course_ID, Teacher_Email) VALUES (?, ?, ?, ?)',
            [QR_ID, generatedTime, Course_ID, teacherEmail]
        );

        const qrDataUrl = await qrcode.toDataURL(QR_ID);
        console.log(`QR code ${QR_ID} generated for course ${Course_ID} by teacher ${teacherEmail}`);
        res.status(201).json({
            message: 'QR code generated successfully. Valid for 15 minutes.',
            qr: { QR_ID: QR_ID, Course_ID: Course_ID, Generated_Time: generatedTime, data_url: qrDataUrl }
        });
    } catch (err) {
        console.error('Error generating QR code:', err);
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ error: `Invalid Course ID (${Course_ID}) or internal reference issue.` });
        }
        res.status(500).json({ error: 'Failed to generate QR code', details: err.message });
    }
});

// POST Mark attendance using QR code (Requires Student role)
app.post('/api/attendance/mark', authenticateToken, requireStudent, async (req, res) => {
    const studentPRN = req.user.PRN;
    const { QR_ID } = req.body;
    const userAgent = req.headers['user-agent']; // Get user agent for device tracking

    if (!QR_ID) {
        return res.status(400).json({ error: 'QR Code ID is required from the scan.' });
    }

    try {
        const qrCodes = await executeQuery(
            `SELECT QR_ID, Course_ID, Generated_Time
             FROM QR_code
             WHERE QR_ID = ? AND Generated_Time >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
            [QR_ID]
        );

        if (qrCodes.length === 0) {
             console.log(`Attendance marking failed: Invalid or expired QR code ${QR_ID} for student ${studentPRN}.`);
            return res.status(400).json({ error: 'Invalid or expired QR code. Please scan a fresh code.' });
        }

        const qrCode = qrCodes[0];
        const courseIdForQR = qrCode.Course_ID;

        const studentCourse = await executeQuery(
            'SELECT PRN FROM student_course WHERE PRN = ? AND Course_ID = ?',
            [studentPRN, courseIdForQR]
        );
        if (studentCourse.length === 0) {
             console.log(`Attendance marking failed: Student ${studentPRN} is not registered for course ${courseIdForQR}.`);
            return res.status(403).json({ error: 'You are not registered for the course associated with this QR code.' });
        }

        const existingAttendance = await executeQuery(
            'SELECT Attendance_ID FROM attendance WHERE PRN = ? AND QR_ID = ?',
            [studentPRN, QR_ID]
        );
        if (existingAttendance.length > 0) {
             console.log(`Attendance marking failed: Attendance already marked for student ${studentPRN} with QR ${QR_ID}.`);
            return res.status(409).json({ error: 'Attendance already marked for this session.' });
        }

        const attendanceId = uuidv4();
        const attendanceTimestamp = new Date();
        const attendanceStatus = true;

        await executeQuery(
            'INSERT INTO attendance (Attendance_ID, Date, PRN, Course_ID, QR_ID, Status) VALUES (?, ?, ?, ?, ?, ?)',
            [attendanceId, attendanceTimestamp, studentPRN, courseIdForQR, QR_ID, attendanceStatus]
        );

        // Update Last_Used for the student's device(s)
        // This assumes one primary device, or you might need more specific device identification from client
        await executeQuery(
            'UPDATE student_devices SET Last_Used = ?, User_Agent = IFNULL(?, User_Agent) WHERE Student_PRN = ? ORDER BY Registered_At DESC LIMIT 1', // Update the most recently registered device
            [attendanceTimestamp, userAgent, studentPRN]
        );
        console.log(`Attendance marked successfully for student ${studentPRN} for course ${courseIdForQR}. Device last used updated.`);

        res.status(201).json({ message: 'Attendance marked successfully!' });
    } catch (err) {
        console.error(`Error marking attendance for student ${studentPRN} with QR ${QR_ID}:`, err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Attendance already marked for this session (race condition).' });
        }
         if (err.code === 'ER_NO_REFERENCED_ROW_2') {
             console.error(`Foreign key constraint failed during attendance for student ${studentPRN}, QR ${QR_ID}.`);
            return res.status(400).json({ error: 'Data inconsistency error. Please try again.' });
        }
        res.status(500).json({ error: 'Failed to mark attendance', details: err.message });
    }
});

// GET Active QR codes for a specific course (Teacher dashboard)
app.get('/api/courses/:courseId/active-qr', authenticateToken, requireTeacher, async (req, res) => {
    const { courseId } = req.params;
     const teacherEmail = req.user.Email;

    try {
         const teacherCourse = await executeQuery(
            'SELECT Teacher_Email FROM teacher_course WHERE Teacher_Email = ? AND Course_ID = ?',
            [teacherEmail, courseId]
        );
        if (teacherCourse.length === 0 && !req.user.Is_Admin) { // Admin might override
            return res.status(403).json({ error: 'You are not authorized for this course.' });
        }

        const activeQR = await executeQuery(
            `SELECT QR_ID, Generated_Time, Course_ID, Teacher_Email
             FROM QR_code
             WHERE Course_ID = ? AND Generated_Time >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
             ORDER BY Generated_Time DESC`,
            [courseId]
        );
        res.status(200).json(activeQR);
    } catch (err) {
        console.error(`Error fetching active QR codes for course ${courseId}:`, err);
        res.status(500).json({ error: 'Failed to fetch active QR codes', details: err.message });
    }
});

// GET Display QR code image data again (Teacher refreshes page)
app.get('/api/qr/:qrId/display', authenticateToken, requireTeacher, async (req, res) => {
    const { qrId } = req.params;
    const teacherEmail = req.user.Email;

    try {
        const qrCodes = await executeQuery(
            'SELECT QR_ID, Course_ID, Generated_Time, Teacher_Email FROM QR_code WHERE QR_ID = ?',
            [qrId]
        );

        if (qrCodes.length === 0) {
            return res.status(404).json({ error: 'QR code not found.' });
        }
        const qrCodeInfo = qrCodes[0];

        if (qrCodeInfo.Teacher_Email !== teacherEmail && !req.user.Is_Admin) { // Admin override
            return res.status(403).json({ error: 'Forbidden: You did not generate this QR code.' });
        }

        const generatedTime = new Date(qrCodeInfo.Generated_Time);
        const expirationTime = new Date(generatedTime.getTime() + 15 * 60000);
        if (new Date() > expirationTime) {
             return res.status(410).json({ error: 'This QR code has expired.' }); // Gone
        }

        const qrDataUrl = await qrcode.toDataURL(qrId);
        res.status(200).json({
            message: 'QR Code Data',
            qr: {
                QR_ID: qrCodeInfo.QR_ID, Course_ID: qrCodeInfo.Course_ID,
                Generated_Time: qrCodeInfo.Generated_Time, Expires_At: expirationTime.toISOString(),
                data_url: qrDataUrl
            }
        });
    } catch (err) {
        console.error(`Error retrieving display data for QR code ${qrId}:`, err);
        res.status(500).json({ error: 'Failed to retrieve QR code display data', details: err.message });
    }
});


// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Frontend expected at: ${corsOptions.origin}`);
    console.log(`🔑 Using JWT Secret: ${JWT_SECRET === 'YOUR_VERY_STRONG_AND_SECRET_KEY_REPLACE_ME_IN_PRODUCTION' ? '⚠️ DEFAULT - CHANGE IN PRODUCTION! ⚠️' : 'Custom (OK)'}`);
    console.log(`🔒 Secure cookies enabled in production: ${process.env.NODE_ENV === 'production'}`);
    const currentISTDate = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    console.log(`🕒 Current Server Time (IST): ${currentISTDate}`);

});

// Export app for potential testing frameworks
module.exports = app;