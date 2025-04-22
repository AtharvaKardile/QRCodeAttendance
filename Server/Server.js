const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');
const {v4: uuidv4} = require('uuid');
const cors = require('cors');
const qrcode = require('qrcode');

const app = express();

// CORS configuration
const corsOptions = {
    origin: 'http://localhost:5173', // Your React app's origin
    optionsSuccessStatus: 200
};

// Apply middleware in the correct order - CORS first
app.use(cors(corsOptions));

// Middleware to parse JSON and form data - only apply once
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'attendance_system'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        throw err;
    }
    console.log('MySQL Connected Successfully');
});

// Helper function to execute queries with promises
function executeQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

// ==================== CLASS ROUTES ====================
app.get('/api/classes', async (req, res) => {
    try {
        const classes = await executeQuery('SELECT * FROM class');
        res.status(200).json(classes);
    } catch (err) {
        console.error('Error fetching classes:', err);
        res.status(500).json({error: 'Error fetching classes', details: err.message});
    }
});

// Add a new class
app.post('/api/classes', async (req, res) => {
    const {Class_ID, Year, No_Of_Students} = req.body;

    if (!Class_ID || !Year || !No_Of_Students) {
        return res.status(400).json({error: 'Class ID, Year, and Number of Students are required'});
    }

    try {
        await executeQuery(
            'INSERT INTO class (Class_ID, Year, No_Of_Students) VALUES (?, ?, ?)',
            [Class_ID, Year, No_Of_Students]
        );
        res.status(201).json({message: 'Class added successfully'});
    } catch (err) {
        console.error('Error adding class:', err);
        res.status(500).json({error: 'Error adding class', details: err.message});
    }
});

// ==================== DIVISION ROUTES ====================
app.get('/api/divisions', async (req, res) => {
    try {
        const divisions = await executeQuery(`
      SELECT d.Div_ID, d.Name, d.Class_ID, c.Year as Class_Year 
      FROM division d
      JOIN class c ON d.Class_ID = c.Class_ID
    `);
        res.status(200).json(divisions);
    } catch (err) {
        console.error('Error fetching divisions:', err);
        res.status(500).json({error: 'Error fetching divisions', details: err.message});
    }
});

// Add a new division
app.post('/api/divisions', async (req, res) => {
    const {Div_ID, Name, Class_ID} = req.body;

    if (!Div_ID || !Name || !Class_ID) {
        return res.status(400).json({error: 'Division ID, Name, and Class ID are required'});
    }

    try {
        // Check if the Class_ID exists
        const classResult = await executeQuery(
            'SELECT * FROM class WHERE Class_ID = ?',
            [Class_ID]
        );

        if (classResult.length === 0) {
            return res.status(400).json({error: `Class with ID ${Class_ID} does not exist. Please create the class first.`});
        }

        // Class exists, so proceed with division creation
        await executeQuery(
            'INSERT INTO division (Div_ID, Name, Class_ID) VALUES (?, ?, ?)',
            [Div_ID, Name, Class_ID]
        );
        res.status(201).json({message: 'Division added successfully'});
    } catch (err) {
        console.error('Error adding division:', err);
        res.status(500).json({error: 'Error adding division', details: err.message});
    }
});

// Get divisions by Class ID
app.get('/api/classes/:classId/divisions', async (req, res) => {
    const {classId} = req.params;

    try {
        const divisions = await executeQuery(
            'SELECT * FROM division WHERE Class_ID = ?',
            [classId]
        );
        res.status(200).json(divisions);
    } catch (err) {
        console.error('Error fetching divisions for class:', err);
        res.status(500).json({error: 'Error fetching divisions', details: err.message});
    }
});

// Update a division
app.put('/api/divisions/:divisionId', async (req, res) => {
    const {divisionId} = req.params;
    const {Name, Class_ID} = req.body;

    if (!Name || !Class_ID) {
        return res.status(400).json({error: 'Name and Class ID are required'});
    }

    try {
        // Check if the Class_ID exists
        const classResult = await executeQuery(
            'SELECT * FROM class WHERE Class_ID = ?',
            [Class_ID]
        );

        if (classResult.length === 0) {
            return res.status(400).json({error: `Class with ID ${Class_ID} does not exist`});
        }

        await executeQuery(
            'UPDATE division SET Name = ?, Class_ID = ? WHERE Div_ID = ?',
            [Name, Class_ID, divisionId]
        );
        res.status(200).json({message: 'Division updated successfully'});
    } catch (err) {
        console.error('Error updating division:', err);
        res.status(500).json({error: 'Error updating division', details: err.message});
    }
});

// ==================== COURSE ROUTES ====================
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await executeQuery(
            'SELECT c.*, cl.Year as Class_Year FROM course c JOIN class cl ON c.Class_ID = cl.Class_ID'
        );
        res.status(200).json(courses);
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.status(500).json({error: 'Error fetching courses', details: err.message});
    }
});

// Add a new course
app.post('/api/courses', async (req, res) => {
    const {Course_Code, Course_Name, Class_ID} = req.body;

    if (!Course_Code || !Course_Name || !Class_ID) {
        return res.status(400).json({error: 'Course Code, Course Name, and Class ID are required'});
    }

    try {
        // Check if the Class_ID exists
        const classResult = await executeQuery(
            'SELECT * FROM class WHERE Class_ID = ?',
            [Class_ID]
        );

        if (classResult.length === 0) {
            return res.status(400).json({error: `Class with ID ${Class_ID} does not exist. Please create the class first.`});
        }

        // Class exists, so proceed with course creation
        await executeQuery(
            'INSERT INTO course (Course_Code, Course_Name, Class_ID) VALUES (?, ?, ?)',
            [Course_Code, Course_Name, Class_ID]
        );
        res.status(201).json({message: 'Course added successfully'});
    } catch (err) {
        console.error('Error adding course:', err);
        res.status(500).json({error: 'Error adding course', details: err.message});
    }
});

// Get courses by Class ID
app.get('/api/classes/:classId/courses', async (req, res) => {
    const {classId} = req.params;

    try {
        const courses = await executeQuery(
            'SELECT * FROM course WHERE Class_ID = ?',
            [classId]
        );
        res.status(200).json(courses);
    } catch (err) {
        console.error('Error fetching courses for class:', err);
        res.status(500).json({error: 'Error fetching courses', details: err.message});
    }
});

// ==================== STUDENT ROUTES ====================
app.get('/api/students', async (req, res) => {
    try {
        const students = await executeQuery(`
      SELECT s.*, d.Name as Division_Name, c.Year as Class_Year
      FROM student s
      JOIN division d ON s.Div_ID = d.Div_ID
      JOIN class c ON d.Class_ID = c.Class_ID
    `);
        res.status(200).json(students);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({error: 'Error fetching students', details: err.message});
    }
});

// Register a new student
app.post('/api/students/register', async (req, res) => {
    console.log('Received student registration data:', req.body);
    const {PRN, Name, Mobile_Number, Email_ID, Password, Div_ID} = req.body;

    if (!PRN || !Name || !Mobile_Number || !Email_ID || !Password || !Div_ID) {
        console.log('Missing required student fields');
        return res.status(400).json({error: 'Please provide all required fields'});
    }

    try {
        // First check if the Division_ID exists
        const divisionResult = await executeQuery(
            'SELECT * FROM division WHERE Div_ID = ?',
            [Div_ID]
        );

        if (divisionResult.length === 0) {
            return res.status(400).json({error: `Division with ID ${Div_ID} does not exist. Please create the division first.`});
        }

        // Check if student PRN or email already exists
        const existingStudent = await executeQuery(
            'SELECT * FROM student WHERE PRN = ? OR Email_ID = ?',
            [PRN, Email_ID]
        );

        if (existingStudent.length > 0) {
            return res.status(400).json({error: 'Student with this PRN or Email already exists'});
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(Password, 10);

        // Division exists, so proceed with student registration
        await executeQuery(
            'INSERT INTO student (PRN, Name, Mobile_Number, Email_ID, Password, Div_ID) VALUES (?, ?, ?, ?, ?, ?)',
            [PRN, Name, Mobile_Number, Email_ID, hashedPassword, Div_ID]
        );
        console.log('Student added successfully');
        res.status(201).json({message: 'Student registered successfully'});
    } catch (err) {
        console.error('Error registering student:', err);
        res.status(500).json({error: 'Error registering student', details: err.message});
    }
});

// Student login
app.post('/api/students/login', async (req, res) => {
    const {Email_ID, Password} = req.body;

    if (!Email_ID || !Password) {
        return res.status(400).json({error: 'Email and Password are required'});
    }

    try {
        const students = await executeQuery(
            'SELECT * FROM student WHERE Email_ID = ?',
            [Email_ID]
        );

        if (students.length === 0) {
            return res.status(401).json({error: 'Invalid Email or Password'});
        }

        const student = students[0];
        const validPassword = await bcrypt.compare(Password, student.Password);

        if (!validPassword) {
            return res.status(401).json({error: 'Invalid Email or Password'});
        }

        // Return student info
        res.status(200).json({
            message: 'Login successful',
            student: {
                PRN: student.PRN,
                Name: student.Name,
                Email_ID: student.Email_ID,
                Div_ID: student.Div_ID
            }
        });
    } catch (err) {
        console.error('Error during student login:', err);
        res.status(500).json({error: 'Server error during login', details: err.message});
    }
});

// Get courses for a student
app.get('/api/students/:prn/courses', async (req, res) => {
    const {prn} = req.params;

    try {
        const courses = await executeQuery(`
      SELECT c.Course_Code, c.Course_Name
      FROM course c
      JOIN student_course sc ON c.Course_Code = sc.Course_Code
      WHERE sc.PRN = ?
    `, [prn]);

        res.status(200).json(courses);
    } catch (err) {
        console.error('Error fetching student courses:', err);
        res.status(500).json({error: 'Error fetching courses', details: err.message});
    }
});

// Assign student to a course
app.post('/api/students/:prn/courses', async (req, res) => {
    const {prn} = req.params;
    const {Course_Code} = req.body;

    if (!Course_Code) {
        return res.status(400).json({error: 'Course Code is required'});
    }

    try {
        // Check if student exists
        const studentResult = await executeQuery(
            'SELECT * FROM student WHERE PRN = ?',
            [prn]
        );

        if (studentResult.length === 0) {
            return res.status(400).json({error: `Student with PRN ${prn} does not exist`});
        }

        // Check if course exists
        const courseResult = await executeQuery(
            'SELECT * FROM course WHERE Course_Code = ?',
            [Course_Code]
        );

        if (courseResult.length === 0) {
            return res.status(400).json({error: `Course with Code ${Course_Code} does not exist`});
        }

        // Check if assignment already exists
        const existingAssignment = await executeQuery(
            'SELECT * FROM student_course WHERE PRN = ? AND Course_Code = ?',
            [prn, Course_Code]
        );

        if (existingAssignment.length > 0) {
            return res.status(400).json({error: 'Student is already assigned to this course'});
        }

        // Assign student to course
        await executeQuery(
            'INSERT INTO student_course (PRN, Course_Code) VALUES (?, ?)',
            [prn, Course_Code]
        );
        res.status(201).json({message: 'Student assigned to course successfully'});
    } catch (err) {
        console.error('Error assigning student to course:', err);
        res.status(500).json({error: 'Error assigning student to course', details: err.message});
    }
});

// Get attendance for a student
app.get('/api/students/:prn/attendance', async (req, res) => {
    const {prn} = req.params;

    try {
        const attendance = await executeQuery(`
      SELECT 
        c.Course_Code,
        c.Course_Name,
        COUNT(DISTINCT qr.QR_ID) AS total_classes,
        SUM(CASE WHEN a.Is_Present = TRUE THEN 1 ELSE 0 END) AS classes_attended,
        CASE
          WHEN COUNT(DISTINCT qr.QR_ID) > 0 
          THEN (SUM(CASE WHEN a.Is_Present = TRUE THEN 1 ELSE 0 END) / COUNT(DISTINCT qr.QR_ID)) * 100 
          ELSE 0 
        END AS attendance_percentage
      FROM student s
      JOIN student_course sc ON s.PRN = sc.PRN
      JOIN course c ON sc.Course_Code = c.Course_Code
      LEFT JOIN QR_code qr ON c.Course_Code = qr.Course_Code
      LEFT JOIN attendance a ON s.PRN = a.PRN AND qr.QR_ID = a.QR_ID
      WHERE s.PRN = ?
      GROUP BY c.Course_Code
    `, [prn]);

        res.status(200).json(attendance);
    } catch (err) {
        console.error('Error fetching student attendance:', err);
        res.status(500).json({error: 'Error fetching attendance', details: err.message});
    }
});

// ==================== TEACHER ROUTES ====================
app.get('/api/teachers', async (req, res) => {
    try {
        const teachers = await executeQuery(
            'SELECT Email_ID, Name, Mobile_Number FROM teacher'
        );
        res.status(200).json(teachers);
    } catch (err) {
        console.error('Error fetching teachers:', err);
        res.status(500).json({error: 'Error fetching teachers', details: err.message});
    }
});

// Register a new teacher
app.post('/api/teachers/register', async (req, res) => {
    const {Email_ID, Name, Password, Mobile_Number} = req.body;

    if (!Email_ID || !Name || !Password || !Mobile_Number) {
        return res.status(400).json({error: 'All fields are required'});
    }

    try {
        // Check if teacher already exists
        const existingTeacher = await executeQuery(
            'SELECT * FROM teacher WHERE Email_ID = ?',
            [Email_ID]
        );

        if (existingTeacher.length > 0) {
            return res.status(400).json({error: 'Teacher with this Email already exists'});
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(Password, 10);

        // Register teacher
        await executeQuery(
            'INSERT INTO teacher (Email_ID, Name, Password, Mobile_Number) VALUES (?, ?, ?, ?)',
            [Email_ID, Name, hashedPassword, Mobile_Number]
        );
        res.status(201).json({message: 'Teacher registered successfully'});
    } catch (err) {
        console.error('Error registering teacher:', err);
        res.status(500).json({error: 'Error registering teacher', details: err.message});
    }
});

// Teacher login
app.post('/api/teachers/login', async (req, res) => {
    const {Email_ID, Password} = req.body;

    if (!Email_ID || !Password) {
        return res.status(400).json({error: 'Email and Password are required'});
    }

    try {
        const teachers = await executeQuery(
            'SELECT * FROM teacher WHERE Email_ID = ?',
            [Email_ID]
        );

        if (teachers.length === 0) {
            return res.status(401).json({error: 'Invalid Email or Password'});
        }

        const teacher = teachers[0];
        const validPassword = await bcrypt.compare(Password, teacher.Password);

        if (!validPassword) {
            return res.status(401).json({error: 'Invalid Email or Password'});
        }

        // Return teacher info
        res.status(200).json({
            message: 'Login successful',
            teacher: {
                Email_ID: teacher.Email_ID,
                Name: teacher.Name,
                Mobile_Number: teacher.Mobile_Number
            }
        });
    } catch (err) {
        console.error('Error during teacher login:', err);
        res.status(500).json({error: 'Server error during login', details: err.message});
    }
});

// Get all students for a teacher's courses
app.get('/api/teachers/:email/students', async (req, res) => {
    const {email} = req.params;

    try {
        const students = await executeQuery(`
      SELECT DISTINCT s.PRN, s.Name, s.Email_ID, s.Mobile_Number, d.Name AS Division
      FROM student s
      JOIN division d ON s.Div_ID = d.Div_ID
      JOIN student_course sc ON s.PRN = sc.PRN
      JOIN teacher_course tc ON sc.Course_Code = tc.Course_Code
      WHERE tc.Teacher_Email = ?
    `, [email]);

        res.status(200).json(students);
    } catch (err) {
        console.error('Error fetching students for teacher:', err);
        res.status(500).json({error: 'Error fetching students', details: err.message});
    }
});

// Get courses taught by a teacher
app.get('/api/teachers/:email/courses', async (req, res) => {
    const {email} = req.params;

    try {
        const courses = await executeQuery(`
      SELECT c.Course_Code, c.Course_Name
      FROM course c
      JOIN teacher_course tc ON c.Course_Code = tc.Course_Code
      WHERE tc.Teacher_Email = ?
    `, [email]);

        res.status(200).json(courses);
    } catch (err) {
        console.error('Error fetching teacher courses:', err);
        res.status(500).json({error: 'Error fetching courses', details: err.message});
    }
});

// Assign teacher to a course - Fixed column name mismatch
app.post('/api/teachers/:email/courses', async (req, res) => {
    const {email} = req.params;
    const {Course_Code} = req.body;

    if (!Course_Code) {
        return res.status(400).json({error: 'Course Code is required'});
    }

    try {
        // Check if teacher exists - Fixed column name from Email to Email_ID
        const teacherResult = await executeQuery(
            'SELECT * FROM teacher WHERE Email_ID = ?',
            [email]
        );

        if (teacherResult.length === 0) {
            return res.status(400).json({error: `Teacher with Email ${email} does not exist`});
        }

        // Check if course exists
        const courseResult = await executeQuery(
            'SELECT * FROM course WHERE Course_Code = ?',
            [Course_Code]
        );

        if (courseResult.length === 0) {
            return res.status(400).json({error: `Course with Code ${Course_Code} does not exist`});
        }

        // Check if assignment already exists
        const existingAssignment = await executeQuery(
            'SELECT * FROM teacher_course WHERE Teacher_Email = ? AND Course_Code = ?',
            [email, Course_Code]
        );

        if (existingAssignment.length > 0) {
            return res.status(400).json({error: 'Teacher is already assigned to this course'});
        }

        // Assign teacher to course
        await executeQuery(
            'INSERT INTO teacher_course (Teacher_Email, Course_Code) VALUES (?, ?)',
            [email, Course_Code]
        );
        res.status(201).json({message: 'Teacher assigned to course successfully'});
    } catch (err) {
        console.error('Error assigning teacher to course:', err);
        res.status(500).json({error: 'Error assigning teacher to course', details: err.message});
    }
});

// Get attendance reports for a teacher's course
app.get('/api/teachers/:email/courses/:courseCode/attendance', async (req, res) => {
    const {email, courseCode} = req.params;

    try {
        // First check if the teacher is assigned to this course
        const teacherCourse = await executeQuery(
            'SELECT * FROM teacher_course WHERE Teacher_Email = ? AND Course_Code = ?',
            [email, courseCode]
        );

        if (teacherCourse.length === 0) {
            return res.status(403).json({error: 'You are not authorized to view attendance for this course'});
        }

        // Get attendance report - Add safety division for zero classes
        const attendanceReport = await executeQuery(`
      SELECT 
        s.PRN,
        s.Name,
        d.Name AS Division,
        COUNT(DISTINCT qr.QR_ID) AS total_classes,
        SUM(CASE WHEN a.Is_Present = TRUE THEN 1 ELSE 0 END) AS classes_attended,
        CASE
          WHEN COUNT(DISTINCT qr.QR_ID) > 0 
          THEN (SUM(CASE WHEN a.Is_Present = TRUE THEN 1 ELSE 0 END) / COUNT(DISTINCT qr.QR_ID)) * 100 
          ELSE 0 
        END AS attendance_percentage
      FROM student s
      JOIN division d ON s.Div_ID = d.Div_ID
      JOIN student_course sc ON s.PRN = sc.PRN
      JOIN course c ON sc.Course_Code = c.Course_Code
      LEFT JOIN QR_code qr ON c.Course_Code = qr.Course_Code
      LEFT JOIN attendance a ON s.PRN = a.PRN AND qr.QR_ID = a.QR_ID
      WHERE c.Course_Code = ?
      GROUP BY s.PRN
      ORDER BY attendance_percentage DESC
    `, [courseCode]);

        res.status(200).json(attendanceReport);
    } catch (err) {
        console.error('Error fetching attendance report:', err);
        res.status(500).json({error: 'Error fetching attendance report', details: err.message});
    }
});

// ==================== ATTENDANCE ROUTES ====================

// Generate QR code for attendance
app.post('/api/qr/generate', async (req, res) => {
    const {Course_Code, Teacher_Email} = req.body;

    if (!Course_Code || !Teacher_Email) {
        return res.status(400).json({error: 'Course Code and Teacher Email are required'});
    }

    try {
        // Check if teacher is assigned to this course
        const teacherCourse = await executeQuery(
            'SELECT * FROM teacher_course WHERE Teacher_Email = ? AND Course_Code = ?',
            [Teacher_Email, Course_Code]
        );

        if (teacherCourse.length === 0) {
            return res.status(403).json({error: 'You are not authorized to generate QR codes for this course'});
        }

        // Generate a unique QR code ID using UUID
        const QR_ID = uuidv4();
        const now = new Date();

        // QR code is valid for 15 minutes
        const QR_Start_Time = now;
        const QR_End_Time = new Date(now.getTime() + 15 * 60000); // 15 minutes later

        await executeQuery(
            'INSERT INTO QR_code (QR_ID, QR_Start_Time, QR_End_Time, Course_Code, Teacher_Email) VALUES (?, ?, ?, ?, ?)',
            [QR_ID, QR_Start_Time, QR_End_Time, Course_Code, Teacher_Email]
        );

        // Generate the QR code image immediately
        const qrDataUrl = await new Promise((resolve, reject) => {
            qrcode.toDataURL(QR_ID, (err, url) => {
                if (err) reject(err);
                else resolve(url);
            });
        });

        res.status(201).json({
            message: 'QR code generated successfully',
            qr: {
                QR_ID,
                Course_Code,
                QR_Start_Time,
                QR_End_Time,
                Teacher_Email,
                data_url: qrDataUrl
            }
        });
    } catch (err) {
        console.error('Error generating QR code:', err);
        res.status(500).json({error: 'Error generating QR code', details: err.message});
    }
});

// Mark attendance using QR code
app.post('/api/attendance/mark', async (req, res) => {
    const {PRN, QR_ID} = req.body;

    if (!PRN || !QR_ID) {
        return res.status(400).json({error: 'PRN and QR Code ID are required'});
    }

    try {
        // Check if the QR code exists and is valid (not expired)
        const qrCodes = await executeQuery(
            'SELECT * FROM QR_code WHERE QR_ID = ? AND QR_End_Time > NOW()',
            [QR_ID]
        );

        if (qrCodes.length === 0) {
            return res.status(400).json({error: 'Invalid or expired QR code'});
        }

        const qrCode = qrCodes[0];

        // Check if student is registered for this course
        const studentCourse = await executeQuery(
            'SELECT * FROM student_course WHERE PRN = ? AND Course_Code = ?',
            [PRN, qrCode.Course_Code]
        );

        if (studentCourse.length === 0) {
            return res.status(400).json({error: 'Student is not registered for this course'});
        }

        // Check if attendance is already marked
        const existingAttendance = await executeQuery(
            'SELECT * FROM attendance WHERE PRN = ? AND QR_ID = ?',
            [PRN, QR_ID]
        );

        if (existingAttendance.length > 0) {
            return res.status(400).json({error: 'Attendance already marked for this session'});
        }

        // Mark attendance
        const now = new Date();
        await executeQuery(
            'INSERT INTO attendance (Is_Present, Timestamp, PRN, QR_ID) VALUES (?, ?, ?, ?)',
            [true, now, PRN, QR_ID]
        );

        res.status(201).json({message: 'Attendance marked successfully'});
    } catch (err) {
        console.error('Error marking attendance:', err);
        res.status(500).json({error: 'Error marking attendance', details: err.message});
    }
});

// Get active QR codes for a course
app.get('/api/courses/:courseCode/active-qr', async (req, res) => {
    const {courseCode} = req.params;

    try {
        const activeQR = await executeQuery(
            'SELECT * FROM QR_code WHERE Course_Code = ? AND QR_End_Time > NOW()',
            [courseCode]
        );

        res.status(200).json(activeQR);
    } catch (err) {
        console.error('Error fetching active QR codes:', err);
        res.status(500).json({error: 'Error fetching active QR codes:', err});
        res.status(500).send('Error fetching active QR codes');
    }
});
// Display QR code image
app.get('/api/qr/:qrId/display', async (req, res) => {
    const {qrId} = req.params;

    try {
        // Check if QR code exists
        const qrCodes = await executeQuery(
            'SELECT * FROM QR_code WHERE QR_ID = ?',
            [qrId]
        );

        if (qrCodes.length === 0) {
            return res.status(404).send('QR code not found');
        }

        // Encode the QR ID and related information
        const qrCodeInfo = qrCodes[0];

        // Generate QR code as data URL
        qrcode.toDataURL(qrId, (err, dataUrl) => {
            if (err) {
                console.error('Error generating QR code image:', err);
                return res.status(500).send('Error generating QR code image');
            }

            // Send response with QR code details and image data
            res.status(200).json({
                qr: {
                    QR_ID: qrCodeInfo.QR_ID,
                    Course_Code: qrCodeInfo.Course_Code,
                    QR_Start_Time: qrCodeInfo.QR_Start_Time,
                    QR_End_Time: qrCodeInfo.QR_End_Time,
                    data_url: dataUrl
                }
            });
        });
    } catch (err) {
        console.error('Error retrieving QR code:', err);
        res.status(500).send('Error retrieving QR code: ' + err.message);
    }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes