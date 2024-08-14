let score = 0;
let combo = 0;
let currentQuestionIndex = 0;
let timeLeft = 60; // 60 seconds for the quiz
let timer;
let questions;
let timeout;
let maxCombo = 0;

const bgmElement = document.getElementById('bgm');
const bgmEndElement = document.getElementById('bgm_end');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomInterferenceQuestion() {
    const patterns = ['constructive interference', 'destructive interference'];

    const correctPattern = patterns[getRandomInt(0, 1)];
    const incorrectPatterns = patterns.filter(p => p !== correctPattern);
    const additionalIncorrectPatterns = [
        'partial interference', 'no interference'
    ].filter(p => !patterns.includes(p) && p !== correctPattern).slice(0, 2);

    const options = [correctPattern, ...incorrectPatterns, ...additionalIncorrectPatterns];
    for (let i = options.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i);
        [options[i], options[j]] = [options[j], options[i]];
    }

    return {
        question: `Which option represents ${correctPattern}?`,
        options: options,
        correctAnswer: correctPattern,
        explanation: `The correct answer is ${correctPattern} because...`
    };
}

function generateRandomDiffractionQuestion() {
    const types = ['single-slit diffraction', 'double-slit diffraction', 'diffraction grating'];

    const correctType = types[getRandomInt(0, 2)];
    const incorrectTypes = types.filter(t => t !== correctType);
    const additionalIncorrectTypes = [
        'multi-slit diffraction', 'Fresnel diffraction'
    ].filter(t => !types.includes(t) && t !== correctType).slice(0, 1);

    const options = [correctType, ...incorrectTypes, ...additionalIncorrectTypes];
    for (let i = options.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i);
        [options[i], options[j]] = [options[j], options[i]];
    }

    return {
        question: `Which type of diffraction is described by ${correctType}?`,
        options: options,
        correctAnswer: correctType,
        explanation: `The correct answer is ${correctType} because...`
    };
}

// Function to generate a set of random questions
function generateRandomQuestions(numQuestions) {
    const questions = [];
    for (let i = 0; i < numQuestions; i++) {
        if (getRandomInt(0, 1) === 0) {
            questions.push(generateRandomInterferenceQuestion());
        } else {
            questions.push(generateRandomDiffractionQuestion());
        }
    }
    return questions;
}



function loadQuestion() {
    const questionElement = document.getElementById('question');
    const optionsElements = document.querySelectorAll('.option');

    const currentQuestion = questions[currentQuestionIndex];
    questionElement.textContent = currentQuestion.question;

    currentQuestion.options.forEach((option, index) => {
        optionsElements[index].textContent = option;
        optionsElements[index].style.backgroundColor = '#e0e0e0';
        optionsElements[index].disabled = false;
    });

    document.getElementById('explanation').classList.add('hidden');
    document.getElementById('next-button').classList.add('hidden');
}

function checkAnswer(selectedOptionIndex) {
    const options = document.querySelectorAll('.option');
    const explanation = document.getElementById('explanation');
    const currentQuestion = questions[currentQuestionIndex];

    const selectedOptionText = options[selectedOptionIndex].textContent.trim();

    if (selectedOptionText === currentQuestion.correctAnswer) {
        options[selectedOptionIndex].style.backgroundColor = 'green';
        combo += 1;
        maxCombo = Math.max(maxCombo, combo); // Update maxCombo if current combo is greater
        score += 100 + (100 * 25 * (combo - 1)) / 100;
        explanation.classList.add('hidden');
        timeout = setTimeout(nextQuestion, 1000);
    } else {
        let correctOptionIndex = -1;

        options.forEach((option, index) => {
            if (option.textContent.trim() === currentQuestion.correctAnswer) {
                correctOptionIndex = index;
            }
        });

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

    updateProgressBar(); // Update the progress bar
    options.forEach(option => option.disabled = true);
}

function updateProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    const star1 = document.getElementById('star1');
    const star2 = document.getElementById('star2');
    const star3 = document.getElementById('star3');
    
    const progress = Math.min(score / 2000, 1) * 100;
    progressBar.style.width = `${progress}%`;

    if (score >= 500) {
        star1.textContent = '★';
        document.getElementById('marker1').classList.add('hidden');
    } else {
        star1.textContent = '☆';
    }

    if (score >= 1000) {
        star2.textContent = '★';
        document.getElementById('marker2').classList.add('hidden');
    } else {
        star2.textContent = '☆';
    }

    if (score >= 1500) {
        star3.textContent = '★';
        document.getElementById('marker3').classList.add('hidden');
    } else {
        star3.textContent = '☆';
    }
}



function nextQuestion() {
    clearTimeout(timeout);
    currentQuestionIndex += 1;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        endQuiz();
    }
}

function startTimer() {
    const timerBar = document.getElementById('timer-bar');
    const timerBg = document.getElementById('timer-bg');
    const timeLeftElement = document.getElementById('time-left');
    timerBar.style.width = '100%';
    timerBg.style.width = '100%';

    timer = setInterval(() => {
        timeLeft -= 1;
        const widthPercentage = (timeLeft / 60) * 100;
        timerBar.style.width = `${widthPercentage}%`;
        timeLeftElement.textContent = `Time left: ${timeLeft}s`;

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
        starRating = '☆☆☆';
    } else if (score <= 1000) {
        starRating = '★☆☆';
    } else if (score <= 1500) {
        starRating = '★★☆';
    } else {
        starRating = '★★★';
    }

    const maxCombo = Math.max(combo, 0);

    document.getElementById('question-container').innerHTML = `
        <p>Your final score is ${Math.floor(score)}.</p>
        <p>Your maximum combo was ${maxCombo}.</p>
        <div class="star-rating">${starRating}</div>
        <button id="restart-button" onclick="restartQuiz()">Restart Quiz</button>
    `;
    document.getElementById('next-button').classList.add('hidden');
    document.getElementById('explanation').classList.add('hidden');

    bgmElement.pause();
    bgmElement.currentTime = 0; // Reset to start

    // Play ending BGM and make sure it doesn't loop
    bgmEndElement.loop = false;
    bgmEndElement.play();
}



function restartQuiz() {
    location.reload();
}

// Initialize the quiz
questions = generateRandomQuestions(10);
loadQuestion();
startTimer();
