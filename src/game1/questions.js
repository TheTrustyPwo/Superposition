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
function lightColor() {
    let wavelengths = [405, 473, 532, 585, 685];
    let possibleColors = ['Violet', 'Blue', 'Green', 'Yellow', 'Red']
    let randNum = getRandomInt(0, 4);
    
    const wavelength = wavelengths[randNum]
    const correctColor = possibleColors[randNum]

    const shuffledColors = possibleColors.sort(() => 0.5 - Math.random());
    
    // Remove the correctColor from the shuffled array and take the first 3 colors
    const incorrectColors = shuffledColors.filter(color => color !== correctColor).slice(0, 3);
    const options = shuffleOptions([correctColor, ...incorrectColors]);

    return {
        question: `Whhat color is a light of wavelength ${wavelength}nm?`,
        options: options,
        correctAnswer: correctColor,
        explanation: `The correct answer is ${correctColor} because it has a wavelength of ${wavelength}nm!`,
    };
}

// TWO SOURCE INTERFERENCE
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
    var wrongOpt1;

    if ((isInPhase == 1 && isDest == 0) || (isInPhase == 0 && isDest == 0)) { //inphase const or antiphase const
        correctOpt = `Constructive Interference, Phase Difference Δϕ = ${phaseDiff}π`;
        wrongOpt1 = `Destructive Interference, Phase Difference Δϕ = ${phaseDiff}π`;

    } else {
        correctOpt = `Destructive Interference, Phase Difference Δϕ = ${phaseDiff}π`;
        wrongOpt1 = `Constructive Interference, Phase Difference Δϕ = ${phaseDiff}π`;

    };

    const wrongOpt2 = `Destructive Interference, Phase Difference Δϕ = ${pathDiff}π`;
    const wrongOpt3 = `Constructive Interference, Phase Difference Δϕ = ${pathDiff}π`;

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3]);

    return {
        question: `Two sources emit coherent Sound waves ${whatPhase}. If path 1 is ${p1}λ and path 2 is ${p2}λ from screen, What is their phase difference and interference type?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `The correct answer is ${correctOpt} because path difference = ${pathDiff}λ and phase difference = ${phaseDiff}π`,
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
    var wrongOpt1

    if ((isInPhase == 1 && isDest == 0) || (isInPhase == 0 && isDest == 1)) { //inphase const or antiphase dest
        correctOpt = `0, 2π, 4π, ...`;
        wrongOpt1 = `π, 3π, 5π, ...`;

    } else {
        correctOpt = `π, 3π, 5π, ...`;
        wrongOpt1 = `2π, 4π, 6π, ...`;

    };

    const wrongOpt2 = `0, π, 2π, ...`
    const wrongOpt3 = `π/2, 3π/2, 5π/2, ...`

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3]);

    return {
        question: `Which of the below lists the possible phase difference for ${whatType} interference of two sound waves ${whatPhase}?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ``, // Can add in the future
    };

};


//SINGLE SLIT EXPERIMENTS
function SS_changeSlitWidthQuestions() {
    const isInc = getRandomInt(0, 1);

    var whatChanged;
    var correctOpt;

    if (isInc == 1) {
        whatChanged = "bigger";
        correctOpt = "The intensity decreases while the fringe separation doesn’t change";


    } else {
        whatChanged = "smaller";
        correctOpt = "The intensity increases while the fringe separation doesn’t change";
    
    
    };

    const wrongOpt1 = 'The fringe separation decreases'
    const wrongOpt2 = 'Both the intensity and the fringe separation increases'
    const wrongOpt3 = 'Both the intensity and the fringe separation decreases'
    const wrongOpt4 = 'The fringe separation increases'
    const wrongOpt5 = 'The intensity decreases while the fringe separation increases'


    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);

    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `Consider a single slit experiment, when the slit width of the slit is ${whatChanged}, which of the following changes takes place in the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ``,
    };

};

function SS_changeWaveLengthQuestions() {
    const isWidth = getRandomInt(0, 1); //angle of first maxima if 0, width of central maxima if 1
    const isIncrease = getRandomInt(0, 1); //Increase Wavelength if 1 else 0

    const wrongOpt3 = `I am not sure :(`;

    var wavelengthChange;
    var whatHappen;
    var correctOpt;
    var wrongOpt1;
    var wrongOpt2;

    if (isWidth == 1) {
        whatHappen = 'width of the Central Maxima';

        if (isIncrease == 1) {
            wavelengthChange = 'longer';
            correctOpt = 'The width of the Central Maxima decreases'
            wrongOpt1 = 'The width of the Central Maxima increases'
            wrongOpt2 = 'The width of the Central Maxima remains the same'


        } else {
            wavelengthChange = 'shorter';
            correctOpt = 'The width of the Central Maxima increases'
            wrongOpt1 = 'The width of the Central Maxima decreases'
            wrongOpt2 = 'The width of the Central Maxima remains the same'

        };

    } else {
        whatHappen = 'angle of the First Maxima';

        if (isIncrease == 1) {
            wavelengthChange = 'longer';
            correctOpt = 'Angle θ increases'
            wrongOpt1 = 'Angle θ decreases'
            wrongOpt2 = 'Angle θ remains the same'

        } else {
            wavelengthChange = 'shorter';
            wrongOpt1 = 'Angle θ increases'
            correctOpt = 'Angle θ decreases'
            wrongOpt2 = 'Angle θ remains the same'

        };

    }

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3]);

    return {
        question: `Consider a single slit experiment, when the wavelength of the incoming light is ${wavelengthChange}, which of the following changes occurs to the ${whatHappen}?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ``,
    };

};


//DOUBLE SLIT EXPERIMENTS
function DS_WavelengthSlitSeparationQuestions() {
    const isWavelength = getRandomInt(0, 1) //0 for wavelenght, 1 for slit separation
    const isInc = getRandomInt(0, 1) //1 for increase else decrease

    var whatChanged;
    var whatHappened;
    var correctOpt;
    var wrongOpt1;

    if (isWavelength == 1) {
        whatChanged = 'wavelength of the incoming light';

        if (isInc == 1) {
            whatHappened = 'longer';
            correctOpt = 'The fringe separation increases';
            wrongOpt1 = 'The fringe separation decreases';

        } else {
            whatHappened = 'shorter';
            correctOpt = 'The fringe separation decrease';
            wrongOpt1 = 'The fringe separation increase';

        };

    } else {
        whatChanged = 'slit separation of the slits';

        if (isInc == 1) {
            whatHappened = 'longer';
            correctOpt = 'The fringe separation decrease';
            wrongOpt1 = 'The fringe separation increase';

        } else {
            whatHappened = 'shorter';
            correctOpt = 'The fringe separation increases';
            wrongOpt1 = 'The fringe separation decreases';

        };

    };

    const wrongOpt2 = 'Both the intensity and the fringe separation increases';
    const wrongOpt3 = 'Both the intensity and the fringe separation decreases';
    const wrongOpt4 = 'The intensity increases while the fringe separation decreases';
    const wrongOpt5 = 'The intensity decreases while the fringe separation increases';


    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `Consider a double slit experiment, when the ${whatChanged} becomes ${whatHappened}, which of the following changes takes place in the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ``,
    };

};

function DS_ScreenDistanceQuestions() {
    const isInc = getRandomInt(0, 1); // 1 if increase else 0

    var whatChanged;
    var correctOpt;
    var wrongOpt1;

    if (isInc == 1) {
        whatChanged = 'increase';
        correctOpt = 'The fringe separation decreases but the intensity of the maxima increases';
        wrongOpt1 = 'The fringe separation increases but the intensity of the maxima decreases';


    } else {
        whatChanged = 'decrease';
        correctOpt = 'The fringe separation increases but the intensity of the maxima decreases';
        wrongOpt1 = 'The fringe separation decreases but the intensity of the maxima increases';
        

    };
    
    
    const wrongOpt2 = `The fringe separation increases and the intensity of the maxima increases`;
    const wrongOpt3 = `The fringe separation decreases and the intensity of the maxima decreases`;

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3]);

    return {
        question: `Consider a double slit experiment, when you ${whatChanged} the distance from the slits to the screen, which of the following changes takes place in the intensity profile on the screen?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ``,
    };

};


//MULTIPLE SLIT (DIFFRACTION GRATING)
function MS_chagngeGratingQuestions() {
    const isIncrease = getRandomInt(0, 1); //Increase Wavelength if 1 else 0

    const wrongOpt3 = `I am not sure :(`;

    var correctOpt;
    var wrongOpt1;
    var wrongOpt2;
    
    if (isIncrease == 1) {
        whatChanged = 'bigger';
        correctOpt = 'The distance between the maximum orders increase'
        wrongOpt1 = 'The distance between the maximum orders decrease'
        wrongOpt2 = 'The distance between the maximum orders remains the same'


    } else {
        whatChanged = 'smaller';
        correctOpt = 'The distance between the maximum orders decrease'
        wrongOpt1 = 'The distance between the maximum orders increase'
        wrongOpt2 = 'The distance between the maximum orders remains the same'

    }

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3]);

    return {
        question: `Consider a diffraction grating experiment, when the slit separation of the gratings is ${whatChanged}, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ``,
    };

};

function MS_changeWaveLengthQuestions() {
    const isDistance = getRandomInt(0, 1); //angle of first maxima if 0, distance between maxima if 1
    const isIncrease = getRandomInt(0, 1); //Increase Wavelength if 1 else 0

    const wrongOpt3 = `I am not sure :(`;

    var wavelengthChange;
    var whatHappen;
    var correctOpt;
    var wrongOpt1;
    var wrongOpt2;

    if (isDistance == 1) {
        whatHappen = 'distance between the maximum orders';

        if (isIncrease == 1) {
            wavelengthChange = 'longer';
            correctOpt = 'The distance between the maximum orders increases'
            wrongOpt1 = 'The distance between the maximum orders decreases'
            wrongOpt2 = 'The distance between the maximum orders remains the same'


        } else {
            wavelengthChange = 'shorter';
            correctOpt = 'The distance between the maximum orders decreases'
            wrongOpt1 = 'The distance between the maximum orders increases'
            wrongOpt2 = 'The distance between the maximum orders remains the same'

        };

    } else {
        whatHappen = 'angle of the First Maxima';

        if (isIncrease == 1) {
            wavelengthChange = 'longer';
            correctOpt = 'Angle θ increases'
            wrongOpt1 = 'Angle θ decreases'
            wrongOpt2 = 'Angle θ remains the same'

        } else {
            wavelengthChange = 'shorter';
            wrongOpt1 = 'Angle θ increases'
            correctOpt = 'Angle θ decreases'
            wrongOpt2 = 'Angle θ remains the same'

        };

    }

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3]);

    return {
        question: `Consider a diffraction grating experiment, when the wavelength of the incoming light is ${wavelengthChange}, which of the following changes occurs to the ${whatHappen}?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ``,
    };

};




//GENERATING QUESTIONS
function GenQuestion() {
    randomQuestion = getRandomInt(0, 8)
    if (randomQuestion === 0) {
        return lightColor();

    } else if (randomQuestion === 1) {
        return pathDiffQuestions();

    } else if (randomQuestion === 2) {
        return possPhaseDiffQuestions();

    } else if (randomQuestion === 3) {
        return DS_WavelengthSlitSeparationQuestions();

    } else if (randomQuestion === 4){
        return DS_ScreenDistanceQuestions();

    } else if (randomQuestion === 5) {
        return SS_changeSlitWidthQuestions();

    } else if (randomQuestion === 6) {
        return SS_changeWaveLengthQuestions();

    } else if (randomQuestion === 7) {
        return MS_chagngeGratingQuestions();

    } else {
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
