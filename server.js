const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// --- Admin Configuration ---
const ADMIN_EMAILS = ['pratheepkumar2304@gmail.com', 'sivaramanpratheep@gmail.com'];

app.use(cors());
app.use(bodyParser.json());

// --- Database Connection ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pratheep@23042007',
    database: 'quiz',
    port: 3306,
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Successfully connected to the database.');

    // --- Create tables if they don't exist ---
    db.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL);`);
    db.query(`CREATE TABLE IF NOT EXISTS scores (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL, course VARCHAR(255) NOT NULL, score INT NOT NULL, submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
    db.query(`CREATE TABLE IF NOT EXISTS questions (id INT AUTO_INCREMENT PRIMARY KEY, course VARCHAR(50) NOT NULL, question TEXT NOT NULL, options JSON NOT NULL, answer VARCHAR(255) NOT NULL);`);
    db.query(`CREATE TABLE IF NOT EXISTS courses (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, description VARCHAR(255));`);
});

// --- Middleware for checking admin status ---
// In a real app, this should be replaced with token/session validation.
const isEmailAdmin = (email) => ADMIN_EMAILS.includes(email);
const checkAdmin = (req, res, next) => {
    // This is a placeholder for real auth.
    // You would get the user's email from their session token.
    // For now, we don't have a secure way to do this check on the backend.
    // The frontend check provides basic protection.
    next();
};

// --- API Endpoints ---

// Login Endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        if (results.length > 0) {
            res.json({
                message: 'Login successful',
                userId: results[0].id,
                email: results[0].email,
                isAdmin: isEmailAdmin(results[0].email)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    });
});

// Register Endpoint
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
    db.query(query, [email, password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email address already in use.' });
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    });
});

// Get All Courses Endpoint
app.get('/courses', (req, res) => {
    const query = 'SELECT * FROM courses ORDER BY name';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        res.json(results);
    });
});

// Add Course Endpoint (Admin only)
app.post('/add-course', checkAdmin, (req, res) => {
    const { name, description } = req.body;
    if (!name || !description) {
        return res.status(400).json({ message: 'Course name and description are required.' });
    }
    const query = 'INSERT INTO courses (name, description) VALUES (?, ?)';
    db.query(query, [name, description], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Course name already exists.' });
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(201).json({ message: 'Course added successfully', courseId: result.insertId });
    });
});

// Get Questions Endpoint
app.get('/questions/:course', (req, res) => {
    const { course } = req.params;
    const query = 'SELECT * FROM questions WHERE course = ?';
    db.query(query, [course], (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        res.json(results);
    });
});

// Add Question Endpoint (Admin only)
app.post('/add-question', checkAdmin, (req, res) => {
    const { course, question, options, answer } = req.body;
    if (!course || !question || !options || !answer || options.length !== 4) {
        return res.status(400).json({ message: 'All fields and exactly 4 options are required.' });
    }
    const query = 'INSERT INTO questions (course, question, options, answer) VALUES (?, ?, ?, ?)';
    db.query(query, [course, question, JSON.stringify(options), answer], (err, result) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        res.status(201).json({ message: 'Question added successfully', questionId: result.insertId });
    });
});

// Submit Score Endpoint
app.post('/submit', (req, res) => {
    const { email, course, score } = req.body;
    if (!email || !course || score === undefined) {
        return res.status(400).json({ message: 'Email, course, and score are required.' });
    }
    const query = 'INSERT INTO scores (email, course, score) VALUES (?, ?, ?)';
    db.query(query, [email, course, score], (err) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        res.status(201).json({ message: 'Score submitted successfully' });
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
