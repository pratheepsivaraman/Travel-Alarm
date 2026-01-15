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
                    window.location.href = 'courses.html';
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
                alert('Passwords do not match. Please enter the same password.');
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
    const courseItems = document.querySelectorAll('.course-item');
    if (courseItems.length > 0) {
        courseItems.forEach(item => {
            item.addEventListener('click', () => {
                const course = item.getAttribute('data-course');
                window.location.href = `quiz.html?course=${course}`;
            });
        });
    }

    // --- Quiz Page Logic ---
    const quizBox = document.querySelector('.quiz-box');
    if (quizBox) {
        const urlParams = new URLSearchParams(window.location.search);
        const course = urlParams.get('course');
        
        // Check if user is logged in
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
        
        const questions = {
            javascript: [
                { question: 'What is the correct way to declare a variable in JavaScript?', options: ['var', 'let', 'const', 'all of the above'], answer: 'all of the above' },
                { question: 'Which of the following is NOT a JavaScript data type?', options: ['string', 'boolean', 'number', 'float'], answer: 'float' }
            ],
            html: [
                { question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Markup Language', 'Hyperlinks and Text Markup Language', 'Home Tool Markup Language'], answer: 'Hyper Text Markup Language' },
                { question: 'Which HTML tag is used to define an internal style sheet?', options: ['<style>', '<script>', '<css>', '<link>'], answer: '<style>' }
            ],
            css: [
                { question: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Creative Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets'], answer: 'Cascading Style Sheets' },
                { question: 'Which property is used to change the background color of an element?', options: ['background-color', 'color', 'bgcolor', 'background'], answer: 'background-color' }
            ]
        };

        const courseQuestions = questions[course];

        if (course && courseQuestions) {
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

                const userId = sessionStorage.getItem('userId');
                try {
                    await fetch('http://localhost:3000/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, course, score })
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
        } else {
            questionEl.textContent = 'Could not load quiz. Please select a valid course.';
            optionsContainer.style.display = 'none';
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            timerEl.style.display = 'none';
        }
    }
});
