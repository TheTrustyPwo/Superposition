
let score = 0;
let combo = 0;
let currentQuestionIndex = 0;
let timeLeft = 60;
let timer;
let questions;
let timeout;
let wrongQuestions = []
let maxCombo = 0;
let wrongQuestionIndex = 0;

const bgmElement = document.getElementById('bgm');
const bgmEndElement = document.getElementById('bgm_end');


function loadQuestion() {
    const questionElement = document.getElementById('question');
    const optionsElements = document.querySelectorAll('.option');
    const questionNumberElement = document.getElementById('question-number'); // Added

    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion.ShowImage == false) {
        document.getElementById('optImg1').classList.add('hidden');
        document.getElementById('optImg2').classList.add('hidden');
        document.getElementById('optImg3').classList.add('hidden');
        document.getElementById('optImg4').classList.add('hidden');
    } else {
        document.getElementById('optImg1').classList.remove('hidden');
        document.getElementById('optImg2').classList.remove('hidden');
        document.getElementById('optImg3').classList.remove('hidden');
        document.getElementById('optImg4').classList.remove('hidden');
    }
    questionElement.textContent = currentQuestion.question;
    questionNumberElement.textContent = `Question ${currentQuestionIndex + 1}`; // Added

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

        // Add to wrongQuestions
        wrongQuestions.push({
            questionNumber: currentQuestionIndex + 1,
            question: currentQuestion.question,
            correctAnswer: currentQuestion.correctAnswer,
            selectedAnswer: selectedOptionText,
            explanation: currentQuestion.explanation
        });
        timeout = setTimeout(nextQuestion, 1000);
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

    // Hide the timer container
    document.getElementById('timer-container').style.display = 'none';

    let starRating = '';
    if (score < 500) {
        starRating = '☆☆☆';
    } else if (score < 1000) {
        starRating = '★☆☆';
    } else if (score < 1500) {
        starRating = '★★☆';
    } else {
        starRating = '★★★';
    }

    document.getElementById('question-container').innerHTML = 
        `<h2>Final Score: ${Math.floor(score)}</h2>
         <h2>Max Combo: ${maxCombo}</h2>`;

    document.getElementById('star-rating').classList.remove('hidden');
    document.getElementById('star-rating').innerHTML = `${starRating}`;
         

    document.getElementById('next-button').classList.add('hidden');
    document.getElementById('explanation').classList.add('hidden');
    document.getElementById('score').classList.add('hidden');
    document.getElementById('combo').classList.add('hidden');

    // Show restart button at the end
    document.getElementById('restart-button').classList.remove('hidden');
    document.getElementById('return-button').classList.remove('hidden');

    if (wrongQuestions.length > 0) {
        document.getElementById('wrong-questions-container').classList.remove('hidden');
        showWrongQuestion(0);
    } else {
        document.getElementById('no-wrong').classList.remove('hidden')
        document.getElementById('no-wrong').innerHTML = `<h3>Congratulations! You made no errors!</h3>`
    };

    bgmElement.pause();
    bgmElement.currentTime = 0; // Reset to start

    // Play ending BGM and make sure it doesn't loop
    bgmEndElement.loop = false;
    bgmEndElement.play();
}

function showWrongQuestion(index) {
    const wrongQuestion = wrongQuestions[index];
    document.getElementById('wrong-question-number').textContent = `Question ${wrongQuestion.questionNumber}`;
    document.getElementById('wrong-question-text').textContent = wrongQuestion.question;
    // document.getElementById('wrong-question-explanation').textContent = `Explanation: ${wrongQuestion.explanation}`;
    document.getElementById('wrong-question-choice').textContent = `Your Choice: ${wrongQuestion.selectedAnswer}`;
    document.getElementById('show-right-answer').textContent = `Right Answer: ${wrongQuestion.correctAnswer}`

    document.getElementById('prev-wrong-button').style.display = index === 0 ? 'none' : 'inline-block';
    document.getElementById('next-wrong-button').style.display = index === wrongQuestions.length - 1 ? 'none' : 'inline-block';
}

function showPreviousWrongQuestion() {
    if (wrongQuestionIndex > 0) {
        wrongQuestionIndex--;
        showWrongQuestion(wrongQuestionIndex);
    }
}

function showNextWrongQuestion() {
    if (wrongQuestionIndex < wrongQuestions.length - 1) {
        wrongQuestionIndex++;
        showWrongQuestion(wrongQuestionIndex);
    }
}

function restartQuiz() {
    location.reload();
}

// Initialize the quiz

questions = generateRandomQuestions(70);
loadQuestion();
startTimer();
