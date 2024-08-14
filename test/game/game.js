let score = 0;
let combo = 0;
let currentQuestionIndex = 0;
let timeLeft = 60; // 60 seconds for the quiz
let timer;
let shuffledQuestions;
let timeout;

function shuffleQuestions() {
    shuffledQuestions = questions.sort(() => Math.random() - 0.5);
}

// Randomize the order of options
function shuffleOptions(options, images) {
    const shuffled = options.map((option, index) => ({ option, image: images[index] }))
        .sort(() => Math.random() - 0.5);
    return [shuffled.map(item => item.option), shuffled.map(item => item.image)];
}

function loadQuestion() {
    const questionElement = document.getElementById('question');
    const optionContainers = document.querySelectorAll('.option-container');
    const optionsElements = document.querySelectorAll('.option');

    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    questionElement.textContent = currentQuestion.question;
    
    let [shuffledOptions, shuffledImages] = shuffleOptions(currentQuestion.options, currentQuestion.images);

    optionsElements.forEach((option, index) => {
        option.textContent = shuffledOptions[index];
        option.style.backgroundColor = '#e0e0e0';
        option.disabled = false;
    });

    optionContainers.forEach((container, index) => {
        const imgElement = container.querySelector('.option-image');
        imgElement.src = shuffledImages[index];
        imgElement.alt = `Option ${index + 1} Image`;
    });

    document.getElementById('explanation').classList.add('hidden');
    document.getElementById('next-button').classList.add('hidden');
}

function checkAnswer(selectedOptionIndex) {
    const options = document.querySelectorAll('.option');
    const explanation = document.getElementById('explanation');
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    
    // Get the selected option text
    const selectedOptionText = options[selectedOptionIndex].textContent.trim();

    // Check if the selected option text matches the correct answer
    if (selectedOptionText === currentQuestion.correctAnswer) {
        options[selectedOptionIndex].style.backgroundColor = 'green';
        combo += 1;
        score += 100 + (100 * 25 * (combo - 1)) / 100;
        explanation.classList.add('hidden');
        timeout = setTimeout(nextQuestion, 1000); // Automatically go to next question after 1 second
    } else {
        let correctOptionIndex = -1;

        // Find the correct option index
        options.forEach((option, index) => {
            if (option.textContent.trim() === currentQuestion.correctAnswer) {
                correctOptionIndex = index;
            }
        });

        // Highlight the correct and selected options
        options.forEach((option, index) => {
            if (index === correctOptionIndex) {
                option.style.backgroundColor = 'green';
            } else if (index === selectedOptionIndex) {
                option.style.backgroundColor = 'red';
            }
        });

        combo = 0;
        explanation.textContent = currentQuestion.explanation;
        explanation.classList.remove('hidden');
        document.getElementById('next-button').classList.remove('hidden');
    }

    document.getElementById('score').textContent = `Score: ${Math.floor(score)}`;
    document.getElementById('combo').textContent = `Combo: ${combo}`;

    // Disable all options after one is selected
    options.forEach(option => option.disabled = true);
}



function nextQuestion() {
    clearTimeout(timeout); // Clear timeout if user clicks next button
    currentQuestionIndex += 1;
    if (currentQuestionIndex < shuffledQuestions.length) {
        loadQuestion();
    } else {
        endQuiz();
    }
}

function startTimer() {
    const timerBar = document.getElementById('timer-bar');
    const timerBg = document.getElementById('timer-bg');
    const timeLeftElement = document.getElementById('time-left');
    timerBar.style.width = '100%'; // Initialize with full width
    timerBg.style.width = '100%'; // Initialize background as full width

    timer = setInterval(() => {
        timeLeft -= 1;
        const widthPercentage = (timeLeft / 60) * 100;
        timerBar.style.width = `${widthPercentage}%`;
        // Grey background is fixed in place
        timeLeftElement.textContent = `${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            endQuiz();
        }
    }, 1000);
}



function endQuiz() {
    clearInterval(timer);

    let starRating = '';
    if (score < 500) {
        starRating = '★☆☆';
    } else if (score <= 1000) {
        starRating = '★★☆';
    } else {
        starRating = '★★★';
    }

    document.getElementById('question-container').innerHTML = `
        <p>Your final score is ${Math.floor(score)}.</p>
        <div class="star-rating">${starRating}</div>
        <button id="restart-button" onclick="restartQuiz()">Restart Quiz</button>
    `;
    document.getElementById('next-button').classList.add('hidden');
    document.getElementById('explanation').classList.add('hidden')
}

function restartQuiz() {
    // Refresh the page to reset the quiz
    location.reload();
}



// Initialize the first question and start the timer
shuffleQuestions();
loadQuestion();
startTimer();
