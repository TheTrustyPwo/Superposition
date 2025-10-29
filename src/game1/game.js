let score = 0;
let currentQuestionIndex = 0;
let questions;
let wrongQuestions = []
let wrongQuestionIndex = 0;

const bgmElement = document.getElementById('bgm');
const bgmEndElement = document.getElementById('bgm_end');


function loadQuestion() {
    const questionElement = document.getElementById('question');
    const optionsElements = document.querySelectorAll('.option');
    const questionNumberElement = document.getElementById('question-number'); // Added
    const mainImageElement = document.getElementById('question-image');

    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion.ShowImage == false) {
        document.getElementById('optImg1').classList.add('hidden');
        document.getElementById('optImg2').classList.add('hidden');
    } else {
        document.getElementById('optImg1').classList.remove('hidden');
        document.getElementById('optImg2').classList.remove('hidden');
    }
    questionElement.textContent = currentQuestion.question;
    questionNumberElement.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;

    if (currentQuestion.mainImage) {
        mainImageElement.src = currentQuestion.mainImage;
        mainImageElement.classList.remove('hidden');
    } else {
        mainImageElement.classList.add('hidden');
    }

    currentQuestion.options.forEach((option, index) => {
        optionsElements[index].innerHTML = option; // instead of textContent
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
    const progressCircle = document.getElementById(`progress-${currentQuestionIndex}`);

    if (selectedOptionText === currentQuestion.correctAnswer) {
        options[selectedOptionIndex].style.backgroundColor = 'green';
        score += 1;
        progressCircle.classList.add('correct');
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

        explanation.textContent = currentQuestion.explanation;
        explanation.classList.remove('hidden');

        wrongQuestions.push({
            questionNumber: currentQuestionIndex + 1,
            question: currentQuestion.question,
            correctAnswer: currentQuestion.correctAnswer,
            selectedAnswer: selectedOptionText,
            explanation: currentQuestion.explanation
        });

        progressCircle.classList.add('wrong');
    }

    options.forEach(option => option.disabled = true);
    document.getElementById('next-button').classList.remove('hidden');  // Show "Next"
}

function nextQuestion() {
    currentQuestionIndex += 1;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        endQuiz();
    }
}

function endQuiz() {
    document.getElementById('question-container').innerHTML = 
        `<h2>Score: ${score}/${questions.length}!</h2>`;

    document.getElementById('next-button').classList.add('hidden');
    document.getElementById('explanation').classList.add('hidden');

    // Show restart and return buttons
    document.getElementById('restart-button').classList.remove('hidden');
    document.getElementById('return-button').classList.remove('hidden');

    // Wrong question review
    if (wrongQuestions.length > 0) {
        document.getElementById('wrong-questions-container').classList.remove('hidden');
        showWrongQuestion(0);
    } else {
        document.getElementById('no-wrong').classList.remove('hidden');
        document.getElementById('no-wrong').innerHTML = `<h3>Congratulations! You made no errors!</h3>`;
    }

    // Stop quiz BGM, play end BGM
    if (bgmElement) bgmElement.pause();
    if (bgmEndElement) {
        bgmEndElement.loop = false;
        bgmEndElement.play();
    }

    // 🟢 Ask for player name
    const playerName = prompt("Enter your name to record your score:") || "Anonymous";

    try {
        await addDoc(collection(db, "quiz_scores"), {
            name: playerName,
            score: score,
            totalQuestions: questions.length,
            timestamp: new Date().toISOString()
        });
        alert("✅ Score saved!");
    } catch (error) {
        console.error("Error saving score:", error);
        alert("⚠️ Failed to save score. Check console for error.");
    }
};

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

questions = generateRandomQuestions(15);
setupProgressIndicators(15);
loadQuestion();

function setupProgressIndicators(count) {
    const container = document.getElementById('progress-indicators');
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const circle = document.createElement('div');
        circle.classList.add('progress-circle');
        circle.id = `progress-${i}`;
        container.appendChild(circle);
    }
}
