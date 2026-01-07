document.addEventListener('DOMContentLoaded', () => {
    // --- Login Page Logic ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:3000/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('userId', data.userId);
                    sessionStorage.setItem('userEmail', data.email);
                    sessionStorage.setItem('isAdmin', data.isAdmin || false); // Store admin flag
                    
                    if (data.isAdmin && data.email === 'sivaramanpratheep@gmail.com') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'courses.html';
                    }
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }

    // --- Registration Page Logic ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match. Please try again.');
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Registration successful! Please login.');
                    window.location.href = 'index.html';
                } else {
                    alert(data.message);
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    }

    // --- Course Selection Page Logic ---
    const courseSelectionBox = document.querySelector('.course-selection-box');
    if (courseSelectionBox) {
        // Add Admin button if user is admin (and not the auto-redirected admin)
        if (sessionStorage.getItem('isAdmin') === 'true' && sessionStorage.getItem('userEmail') !== 'sivaramanpratheep@gmail.com') {
            const adminButton = document.createElement('a');
            adminButton.href = 'admin.html';
            adminButton.textContent = 'Admin Panel';
            adminButton.classList.add('btn', 'admin-btn');
            courseSelectionBox.insertAdjacentElement('afterend', adminButton);
        }

        const courseList = document.querySelector('.course-list');

        async function fetchAndDisplayCourses() {
            try {
                const response = await fetch('http://localhost:3000/courses');
                const courses = await response.json();
                
                courseList.innerHTML = ''; // Clear placeholder
                courses.forEach(course => {
                    const courseItem = document.createElement('div');
                    courseItem.classList.add('course-item');
                    courseItem.setAttribute('data-course', course.name);
                    
                    courseItem.innerHTML = `
                        <h3>${course.name.charAt(0).toUpperCase() + course.name.slice(1)}</h3>
                        <p>${course.description}</p>
                    `;
                    
                    courseItem.addEventListener('click', () => {
                        window.location.href = `quiz.html?course=${course.name}`;
                    });
                    
                    courseList.appendChild(courseItem);
                });

            } catch (error) {
                console.error('Failed to fetch courses:', error);
                courseList.innerHTML = '<p>Could not load courses. Please try again later.</p>';
            }
        }

        fetchAndDisplayCourses();
    }

    // --- Quiz Page Logic ---
    const quizBox = document.querySelector('.quiz-box');
    if (quizBox) {
        const urlParams = new URLSearchParams(window.location.search);
        const course = urlParams.get('course');
        
        if (!sessionStorage.getItem('userId')) {
            window.location.href = 'index.html';
            return;
        }

        const courseTitle = document.getElementById('course-title');
        const timerEl = document.getElementById('timer');
        const questionEl = document.getElementById('question');
        const optionsContainer = document.getElementById('options-container');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        let courseQuestions = [];

        async function fetchQuestions() {
            try {
                const response = await fetch(`http://localhost:3000/questions/${course}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch questions.');
                }
                const questionsFromServer = await response.json();
                // The mysql2 driver and res.json handle the parsing, so the 'options' field is already an array.
                courseQuestions = questionsFromServer;
                
                if (courseQuestions.length > 0) {
                    initializeQuiz();
                } else {
                    displayError('No questions found for this course.');
                }
            } catch (error) {
                console.error('Fetch questions error:', error);
                displayError('Could not load quiz. Please try again.');
            }
        }

        function displayError(message) {
            questionEl.textContent = message;
            optionsContainer.style.display = 'none';
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            timerEl.style.display = 'none';
        }
        
        function initializeQuiz() {
            let currentQuestionIndex = 0;
            let userAnswers = new Array(courseQuestions.length).fill(null);
            let time = 600;
            let timerInterval;

            courseTitle.textContent = course.toUpperCase();

            function loadQuestion() {
                const currentQuestion = courseQuestions[currentQuestionIndex];
                questionEl.textContent = currentQuestion.question;
                optionsContainer.innerHTML = '';
                currentQuestion.options.forEach(option => {
                    const optionEl = document.createElement('div');
                    optionEl.classList.add('option');
                    optionEl.textContent = option;
                    optionEl.addEventListener('click', () => {
                        userAnswers[currentQuestionIndex] = option;
                        document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
                        optionEl.classList.add('selected');
                    });
                    if (userAnswers[currentQuestionIndex] === option) {
                        optionEl.classList.add('selected');
                    }
                    optionsContainer.appendChild(optionEl);
                });
                updateButtons();
            }

            function updateButtons() {
                prevBtn.disabled = currentQuestionIndex === 0;
                if (currentQuestionIndex === courseQuestions.length - 1) {
                    nextBtn.textContent = 'Submit';
                } else {
                    nextBtn.textContent = 'Next';
                }
            }

            function startTimer() {
                timerInterval = setInterval(() => {
                    const minutes = Math.floor(time / 60);
                    let seconds = time % 60;
                    seconds = seconds < 10 ? '0' + seconds : seconds;
                    timerEl.textContent = `${minutes}:${seconds}`;
                    time--;
                    if (time < 0) {
                        clearInterval(timerInterval);
                        submitQuiz();
                    }
                }, 1000);
            }

            function submitQuiz() {
                const firstUnanswered = userAnswers.findIndex(answer => answer === null);
                if (firstUnanswered !== -1) {
                    alert('Please answer all questions before submitting.');
                    currentQuestionIndex = firstUnanswered;
                    loadQuestion();
                } else {
                    showScore();
                }
            }

            async function showScore() {
                clearInterval(timerInterval);
                let score = 0;
                courseQuestions.forEach((question, index) => {
                    if (userAnswers[index] === question.answer) {
                        score++;
                    }
                });

                const email = sessionStorage.getItem('userEmail');
                try {
                    await fetch('http://localhost:3000/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, course, score })
                    });
                } catch (error) {
                    console.error('Failed to submit score:', error);
                }

                quizBox.innerHTML = `
                    <h2>Quiz Completed!</h2>
                    <p>Your Score: ${score} / ${courseQuestions.length}</p>
                    <button class="btn" onclick="window.location.href = 'index.html'">Exit</button>
                `;
            }

            loadQuestion();
            startTimer();

            prevBtn.addEventListener('click', () => {
                if (currentQuestionIndex > 0) {
                    currentQuestionIndex--;
                    loadQuestion();
                }
            });

            nextBtn.addEventListener('click', () => {
                if (nextBtn.textContent === 'Submit') {
                    submitQuiz();
                } else {
                    currentQuestionIndex++;
                    loadQuestion();
                }
            });
        }
        
        if (course) {
            fetchQuestions();
        } else {
            displayError('No course selected.');
        }
    }
});
