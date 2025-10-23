function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleOptions(options) {
    for (let i = options.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i);
        [options[i], options[j]] = [options[j], options[i]];
    }
    return options
}

// Generating question bank

// TWO SOURCE INTERFERENCE
function phaseDiffQuestions() {
    const isInPhase = getRandomInt(0, 1); //0 if it is in antiphase,  if it is in phase 
    const phaseDiff = getRandomInt(1, 10); 

    var whatPhase; 
    if (isInPhase == 1) {
        whatPhase = "in phase"; 
    } else { 
        whatPhase = "in antiphase"; 
    }

    var remainder = phaseDiff%2 ;
    var correctOpt; 
    var wrongOpt;
    var options;

    if (remainder = 0) {
        correctOpt = 'Constructive Interference';
        wrongOpt1 = 'Destructive Interference'; 
        options = [correctOpt, wrongOpt];
    } else { 
        correctOpt = 'Destructive Interference';
        wrongOpt1 = 'Constructive Interference'; 
        options = [wrongOpt, correctOpt]; 
    } 

    return {
        question: `Given that two sources emit coherent waves ${whatPhase} with a phase difference of ${phaseDiff}π, what is the interference type?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ``, // add later 
        ShowImage: false,
    };
};

function pathDiffQuestions() {
    const isInPhase = getRandomInt(0, 1); //0 if it is in antiphase, 1 if it is in phase
    const isDest = getRandomInt(0, 1); //0 if it is constructive, 1 if it is destructive

    var whatPhase;
    if (isInPhase == 1) {
        whatPhase = "in phase";

    } else {
        whatPhase = "in antiphase";

    }

    var p1;
    var p2;
    if ((isInPhase == 1 && isDest == 0) || (isInPhase == 0 && isDest == 1)) { //inphase const or antiphase dest
        p1 = getRandomInt(2, 10);
        p2 = p1 + 1 * getRandomInt(1, 5);

    } else {
        p1 = getRandomInt(2, 10);
        p2 = p1 + 0.5 + getRandomInt(1, 5);

    };

    const pathDiff = p2 - p1;
    const phaseDiff = pathDiff * 2;

    var correctOpt;
    var wrongOpt;
    var options;

    if ((isInPhase == 1 && isDest == 0) || (isInPhase == 0 && isDest == 0)) { //inphase const or antiphase const
        correctOpt = `Constructive Interference`;
        wrongOpt = `Destructive Interference`;
        options = [correctOpt, wrongOpt]

    } else {
        correctOpt = `Destructive Interference`;
        wrongOpt = `Constructive Interference`;
        options = [wrongOpt, correctOpt]

    };

    return {
        question: `Two sources emit coherent sound waves ${whatPhase}. If path 1 is ${p1}λ and path 2 is ${p2}λ from screen, What is their phase difference and interference type?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `The correct answer is ${correctOpt} because path difference = ${pathDiff}λ and phase difference = ${phaseDiff}π`,
        ShowImage: false,
    };

};

function possPhaseDiffQuestions() {
    const isInPhase = getRandomInt(0, 1); //0 if it is in antiphase, 1 if it is in phase
    const isDest = getRandomInt(0, 1); //0 if it is constructive, 1 if it is destructive

    var whatPhase;

    if (isInPhase == 1) {
        whatPhase = "in phase";

    } else {
        whatPhase = "in antiphase";

    };

    var whatType;
    
    if (isDest == 1) {
        whatType = "destructive";

    } else {
        whatType = "constructive";

    }

    var correctOpt;
    var wrongOpt;

    if ((isInPhase == 1 && isDest == 0) || (isInPhase == 0 && isDest == 1)) { //inphase const or antiphase dest
        correctOpt = `0, 2π, 4π, ...`;
        wrongOpt = `π, 3π, 5π, ...`;

    } else {
        correctOpt = `π, 3π, 5π, ...`;
        wrongOpt = `2π, 4π, 6π, ...`;

    };

    const options = shuffleOptions([correctOpt, wrongOpt]);

    return {
        question: `Which of the below lists the possible phase difference for ${whatType} interference of two sound waves ${whatPhase}?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ``, // Can add in the future
        ShowImage: false,
    };

};


//SINGLE SLIT EXPERIMENTS
function SS_changeWaveLengthQuestions() {
    const isWidth = getRandomInt(0, 1); //angle of first maxima if 0, width of central maxima if 1
    const isIncrease = getRandomInt(0, 1); //Increase Wavelength if 1 else 0

    var wavelengthChange;
    var whatHappen;
    var correctOpt;
    var wrongOpt;

    if (isWidth == 1) {
        whatHappen = 'width of the Central Maxima';

        if (isIncrease == 1) {
            wavelengthChange = 'longer';
            correctOpt = 'The width of the Central Maxima decreases'
            wrongOpt = 'The width of the Central Maxima increases'

        } else {
            wavelengthChange = 'shorter';
            correctOpt = 'The width of the Central Maxima increases'
            wrongOpt = 'The width of the Central Maxima decreases'

        };

    } else {
        whatHappen = 'angle of the First Maxima';

        if (isIncrease == 1) {
            wavelengthChange = 'longer';
            correctOpt = 'Angle θ increases'
            wrongOpt = 'Angle θ decreases'

        } else {
            wavelengthChange = 'shorter';
            wrongOpt = 'Angle θ increases'
            correctOpt = 'Angle θ decreases'

        };

    }

    const options = shuffleOptions([correctOpt, wrongOpt]);

    return {
        question: `Consider a single slit experiment, when the wavelength of the incoming light is ${wavelengthChange}, which of the following changes occurs to the ${whatHappen}?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ``,
        ShowImage: false,
    };

};


//DOUBLE SLIT EXPERIMENTS


//MULTIPLE SLIT (DIFFRACTION GRATING)
function MS_changeGratingQuestions() {
    const isIncrease = getRandomInt(0, 1); //Increase slit separation between gratings if 1 else 0

    var correctOpt;
    var wrongOpt;
    
    if (isIncrease == 1) {
        whatChanged = 'bigger';
        correctOpt = 'The distance between the maximum orders increase'
        wrongOpt = 'The distance between the maximum orders decrease'

    } else {
        whatChanged = 'smaller';
        correctOpt = 'The distance between the maximum orders decrease'
        wrongOpt = 'The distance between the maximum orders increase'

    }

    const options = shuffleOptions([correctOpt, wrongOpt]);

    return {
        question: `Consider a diffraction grating experiment, when the slit separation of the gratings is ${whatChanged}, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ``,
        ShowImage: false,
    };

};

function MS_changeWaveLengthQuestions() {
    const isDistance = getRandomInt(0, 1); //angle of first maxima if 0, distance between maxima if 1
    const isIncrease = getRandomInt(0, 1); //Increase Wavelength if 1 else 0

    var wavelengthChange;
    var whatHappen;
    var correctOpt;
    var wrongOpt;

    if (isDistance == 1) {
        whatHappen = 'distance between the maximum orders';

        if (isIncrease == 1) {
            wavelengthChange = 'longer';
            correctOpt = 'The distance between the maximum orders increases'
            wrongOpt = 'The distance between the maximum orders decreases'

        } else {
            wavelengthChange = 'shorter';
            correctOpt = 'The distance between the maximum orders decreases'
            wrongOpt = 'The distance between the maximum orders increases'
        };

    } else {
        whatHappen = 'angle of the First Maxima';

        if (isIncrease == 1) {
            wavelengthChange = 'longer';
            correctOpt = 'Angle θ increases'
            wrongOpt = 'Angle θ decreases'

        } else {
            wavelengthChange = 'shorter';
            wrongOpt = 'Angle θ increases'
            correctOpt = 'Angle θ decreases'

        };

    }

    const options = shuffleOptions([correctOpt, wrongOpt]);

    return {
        question: `Consider a diffraction grating experiment, when the wavelength of the incoming light is ${wavelengthChange}, which of the following changes occurs to the ${whatHappen}?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ``,
        ShowImage: false,
    };

};




//GENERATING QUESTIONS
function GenQuestion() {
    randomQuestion = getRandomInt(0, 5)
    if (randomQuestion === 0) {
        return phaseDiffQuestions();

    } else if (randomQuestion === 1) {
        return pathDiffQuestions();

    } else if (randomQuestion === 2) {
        return possPhaseDiffQuestions();

    } else if (randomQuestion === 3) {
        return SS_changeWaveLengthQuestions();

    } else if (randomQuestion === 4) {
        return MS_changeGratingQuestions();

    } else if (randomQuestion === 5){
        return MS_changeWaveLengthQuestions();

    } 

}

// Function to generate a set of random questions
function generateRandomQuestions(numQuestions) {
    const questions = [];
    for (let i = 0; i < numQuestions; i++) {
        questions.push(GenQuestion());
        //questions.push(GenQuestion())
    }
    return questions;
}
