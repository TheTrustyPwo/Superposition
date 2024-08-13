let score = 0;
let combo = 0;
let currentQuestionIndex = 0;

function loadQuestion() {
    const questionElement = document.getElementById('question');
    const optionContainers = document.querySelectorAll('.option-container');
    const optionsElements = document.querySelectorAll('.option');

    const currentQuestion = questions[currentQuestionIndex];
    questionElement.textContent = currentQuestion.question;
    
    optionsElements.forEach((option, index) => {
        option.textContent = currentQuestion.options[index];
        option.style.backgroundColor = '#e0e0e0';
        option.disabled = false;
    });

    optionContainers.forEach((container, index) => {
        const imgElement = container.querySelector('.option-image');
        imgElement.src = currentQuestion.images[index]; // Assuming you have an array of images in your question
        imgElement.alt = `Option ${index + 1} Image`;
    });

    document.getElementById('explanation').classList.add('hidden');
    document.getElementById('next-button').classList.add('hidden');
}

function checkAnswer(selectedOption) {
    const options = document.querySelectorAll('.option');
    const explanation = document.getElementById('explanation');
    const currentQuestion = questions[currentQuestionIndex];

    if (selectedOption === currentQuestion.correctAnswer) {
        options[currentQuestion.correctAnswer - 1].style.backgroundColor = 'green';
        combo += 1;
        score += 100 + (100 * 25 * combo) / 100;
        explanation.classList.add('hidden');
    } else {
        options.forEach((option, index) => {
            if (index === currentQuestion.correctAnswer - 1) {
                option.style.backgroundColor = 'green';
            } else {
                option.style.backgroundColor = 'red';
            }
        });
        combo = 0;
        explanation.textContent = currentQuestion.explanation;
        explanation.classList.remove('hidden');
    }

    document.getElementById('score').textContent = `Score: ${Math.floor(score)}`;

    // Disable all options after one is selected
    options.forEach(option => option.disabled = true);

    // Show the next question button
    document.getElementById('next-button').classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex += 1;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        document.getElementById('question-container').innerHTML = '<p>Congratulations! You have completed the quiz.</p>';
        document.getElementById('next-button').classList.add('hidden');
    }
}

// Directly call loadQuestion to initialize the first question
loadQuestion();
