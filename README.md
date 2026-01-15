  Dynamic Quiz Application

  A full-stack web application that allows users to register, log in, and take timed quizzes on various
  programming topics. The application features a complete admin panel for dynamically managing quiz
  courses and questions.

  Features

   - User Authentication: Secure user registration and login system.
   - Dynamic Quizzes:
     - Take timed quizzes from a list of available courses.
     - Questions and courses are loaded dynamically from the database.
     - Scores are saved for each user.
   - Admin Panel:
     - Role-Based Access: The admin panel is only accessible to authorized admin users.
     - Course Management: Admins can add new quiz courses and their descriptions.
     - Question Management: Admins can add new questions with four distinct options to any course.
   - Interactive UI: A responsive and user-friendly interface built with HTML, CSS, and vanilla
     JavaScript.

  Tech Stack

   - Frontend:
     - HTML5
     - CSS3 (with Flexbox for layout)
     - JavaScript (ES6+)
   - Backend:
     - Node.js
     - Express.js
   - Database:
     - MySQL

  Getting Started

  Prerequisites

   - Node.js and npm installed
   - A running MySQL server

  Setup

   1. Clone the repository:

   1     git clone <your-repository-url>
   2     cd <your-repository-folder>

   2. Install dependencies:
      The project uses express, mysql2, body-parser, and cors.

   1     npm install express mysql2 body-parser cors

   3. Database Configuration:
       - Create a new database in MySQL (e.g., quiz).
       - Open server.js and update the db connection object with your MySQL credentials:

   1       const db = mysql.createConnection({
   2           host: 'localhost',
   3           user: 'your_mysql_user',
   4           password: 'your_mysql_password',
   5           database: 'quiz',
   6           port: 3306,
   7       });

   4. Admin Configuration:
       - To grant admin privileges, add user emails to the ADMIN_EMAILS array in server.js:
   1       const ADMIN_EMAILS = ['admin1@example.com', 'admin2@example.com'];

   5. Run the server:
       - Start the backend server from within the Quiz directory:
   1       node server.js
       - The server will be running on http://localhost:3000. The application will automatically create
         the necessary tables (users, courses, questions, scores) in your database if they don't exist.

   6. Open the application:
       - Open the index.html file in your web browser to start using the application.
