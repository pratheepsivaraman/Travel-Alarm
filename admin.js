document.addEventListener('DOMContentLoaded', () => {
    // Check for admin status
    if (sessionStorage.getItem('isAdmin') !== 'true') {
        alert('You are not authorized to view this page.');
        window.location.href = 'index.html';
        return;
    }

    const courseSelect = document.getElementById('course');
    const addQuestionForm = document.getElementById('add-question-form');
    const addCourseForm = document.getElementById('add-course-form');

    const optionInputs = document.querySelectorAll('.option-input');
    const answerSelect = document.getElementById('answer');

    // --- Dynamically populate course dropdown ---
    async function fetchAndPopulateCourses() {
        try {
            const response = await fetch('http://localhost:3000/courses');
            const courses = await response.json();
            
            courseSelect.innerHTML = ''; // Clear existing options
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.name;
                option.textContent = course.name.charAt(0).toUpperCase() + course.name.slice(1);
                courseSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            alert('Could not load course list. Please refresh.');
        }
    }

    // --- Update answer dropdown when options change ---
    function updateAnswerOptions() {
        const currentAnswer = answerSelect.value;
        answerSelect.innerHTML = '';
        
        optionInputs.forEach((input, index) => {
            if (input.value.trim() !== '') {
                const option = document.createElement('option');
                option.value = input.value;
                option.textContent = `Option ${index + 1}: ${input.value}`;
                answerSelect.appendChild(option);
            }
        });
        
        // Preserve selected answer if it still exists
        if (Array.from(optionInputs).some(opt => opt.value === currentAnswer)) {
            answerSelect.value = currentAnswer;
        }
    }

    optionInputs.forEach(input => {
        input.addEventListener('input', updateAnswerOptions);
    });

    // --- "Add Course" form logic ---
    addCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const courseName = document.getElementById('new-course-name').value;
        const courseDesc = document.getElementById('new-course-desc').value;

        try {
            const response = await fetch('http://localhost:3000/add-course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: courseName, description: courseDesc })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Course added successfully!');
                addCourseForm.reset();
                fetchAndPopulateCourses(); // Refresh the course list
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Add course error:', error);
            alert('An error occurred while adding the course.');
        }
    });

    // --- "Add Question" form logic ---
    addQuestionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const course = courseSelect.value;
        const question = document.getElementById('question').value;
        const options = Array.from(optionInputs).map(input => input.value);
        const answer = answerSelect.value;

        if (options.some(opt => opt.trim() === '') || !answer) {
            alert('Please fill out all four options and select a correct answer.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/add-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course, question, options, answer })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Question added successfully!');
                addQuestionForm.reset();
                answerSelect.innerHTML = '';
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Add question error:', error);
            alert('An error occurred while adding the question.');
        }
    });

    // --- Initial setup ---
    fetchAndPopulateCourses();
    updateAnswerOptions();
});