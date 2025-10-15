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

    var remainder = phaseDiff%2 
    var correctOpt 
    var wrongOpt1
    const wrongOpt2 = 'Partial Constructive Interference'; 
    const wrongOpt3 = 'Partial Destructive Interference'; 
    let options;

    if (remainder = 0) {
        correctOpt = 'Constructive Interference';
        wrongOpt1 = 'Destructive Interference'; 
        options = [correctOpt, wrongOpt2, wrongOpt3, wrongOpt1];
    } else { 
        correctOpt = 'Destructive Interference';
        wrongOpt1 = 'Constructive Interference'; 
        options = [wrongOpt1, wrongOpt2, wrongOpt3, correctOpt]; 
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
    var wrongOpt1;

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
        ShowImage: false,
    };

};


//SINGLE SLIT EXPERIMENTS
function SS_changeSlitWidthQuestions() {
    const isInc = getRandomInt(0, 1); // 0 for smaller, 1 for bigger 

    var whatChanged;
    var correctOpt;
    var wrongOpt1;
    const wrongOpt2 = "A: fringe separation decreases, intensity remains the same"
    const wrongOpt3 = "C: fringe separation increases, intensity remains the same"
    let options;

    if (isInc == 1) {
        whatChanged = "bigger";
        correctOpt = "B: fringe separation decreases, intensity increases";
        wrongOpt1 = "D: fringe separation increases, intensity decreases";
        options = [wrongOpt2, correctOpt, wrongOpt3, wrongOpt1];

    } else {
        whatChanged = "smaller";
        correctOpt = "D: fringe separation increases, intensity decreases";
        wrongOpt1 = "B: fringe separation decreases, intensity increases";
        options = [wrongOpt2, wrongOpt1, wrongOpt3, correctOpt];
    
    };

    return {
        question: `Consider a single slit experiment, when the slit width of the slit is ${whatChanged}, which of the following changes takes place in the intensity profile?`,
        options: options,
        mainImage: "assets/images/SS_table.png", 
        correctAnswer: correctOpt,
        explanation: 
        ``,
        ShowImage: false,
    };

};

function SS_changeDistanceQuestions() {
    const isInc = getRandomInt(0, 1); // 0 for decrease, 1 for increase 

    var whatChanged;
    var correctOpt;
    var wrongOpt1;
    const wrongOpt2 = "A: fringe separation decreases, intensity remains the same"
    const wrongOpt3 = "C: fringe separation increases, intensity remains the same"
    let options;

    if (isInc == 0) {
        whatChanged = "decrease";
        correctOpt = "B: fringe separation decreases, intensity increases";
        wrongOpt1 = "D: fringe separation increases, intensity decreases";
        options = [wrongOpt2, correctOpt, wrongOpt3, wrongOpt1];

    } else {
        whatChanged = "increase";
        correctOpt = "D: fringe separation increases, intensity decreases";
        wrongOpt1 = "B: fringe separation decreases, intensity increases";
        options = [wrongOpt2, wrongOpt1, wrongOpt3, correctOpt];
    
    };

    return {
        question: `Consider a single slit experiment, when you ${whatChanged} the distance from the slits to the screen, which of the following changes takes place in the intensity profile on the screen?`,
        options: options,
        mainImage: "assets/images/SS_table.png", 
        correctAnswer: correctOpt,
        explanation: 
        ``,
        ShowImage: false,
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
        ShowImage: false,
    };

};


//DOUBLE SLIT EXPERIMENTS
function DS_WavelengthQuestions() {
    const isInc = getRandomInt(0, 1); // 0 for decrease, 1 for increase 

    var whatChanged;
    var correctOpt;
    var wrongOpt1;
    const wrongOpt2 = "B: fringe separation decreases, intensity increases"
    const wrongOpt3 = "D: fringe separation increases, intensity decreases"
    let options;

    if (isInc == 1) {
        whatChanged = "longer";
        correctOpt = "C: fringe separation inreases, intensity remains the same";
        wrongOpt1 = "A: fringe separation decreases, intensity remains the same";
        options = [wrongOpt1, wrongOpt2, correctOpt, wrongOpt3];

    } else {
        whatChanged = "shorter";
        correctOpt = "A: fringe separation decreases, intensity remains the same";
        wrongOpt1 = "C: fringe separation inreases, intensity remains the same";
        options = [correctOpt, wrongOpt2, wrongOpt1, wrongOpt3];
    
    };


    return {
        question: `Consider a double slit experiment, when the wavelength of the incoming light is ${whatChanged}, which of the following changes takes place in the intensity profile?`,
        options: options,
        mainImage: "assets/images/SS_table.png",
        correctAnswer: correctOpt,
        explanation: 
        ``,
        ShowImage: false,
    };

};

function DS_SlitSeparationQuestions() {
    const isInc = getRandomInt(0, 1); // 0 for decrease, 1 for increase 

    var whatChanged;
    var correctOpt;
    var wrongOpt1;
    const wrongOpt2 = "B: fringe separation decreases, intensity increases"
    const wrongOpt3 = "D: fringe separation increases, intensity decreases"
    let options;

    if (isInc == 0) {
        whatChanged = "shorter";
        correctOpt = "C: fringe separation inreases, intensity remains the same";
        wrongOpt1 = "A: fringe separation decreases, intensity remains the same";
        options = [wrongOpt1, wrongOpt2, correctOpt, wrongOpt3];

    } else {
        whatChanged = "longer";
        correctOpt = "A: fringe separation decreases, intensity remains the same";
        wrongOpt1 = "C: fringe separation inreases, intensity remains the same";
        options = [correctOpt, wrongOpt2, wrongOpt1, wrongOpt3];
    
    };


    return {
        question: `Consider a double slit experiment, when the slit separation of the slits becomes ${whatChanged}, which of the following changes takes place in the intensity profile?` ,
        options: options,
        mainImage: "assets/images/SS_table.png",
        correctAnswer: correctOpt,
        explanation: 
        ``,
        ShowImage: false,
    };

};

function DS_ScreenDistanceQuestions() {
    const isInc = getRandomInt(0, 1); // 1 if increase else 0

    var whatChanged;
    var correctOpt;
    var wrongOpt1;
    const wrongOpt2 = "A: fringe separation decreases, intensity remains the same"
    const wrongOpt3 = "C: fringe separation increases, intensity remains the same"
    let options;

    if (isInc == 0) {
        whatChanged = "decrease";
        correctOpt = "B: fringe separation decreases, intensity increases";
        wrongOpt1 = "D: fringe separation increases, intensity decreases";
        options = [wrongOpt2, correctOpt, wrongOpt3, wrongOpt1];

    } else {
        whatChanged = "increase";
        correctOpt = "D: fringe separation increases, intensity decreases";
        wrongOpt1 = "B: fringe separation decreases, intensity increases";
        options = [wrongOpt2, wrongOpt1, wrongOpt3, correctOpt];
    
    };

    return {
        question: `Consider a double slit experiment, when you ${whatChanged} the distance from the slits to the screen, which of the following changes takes place in the intensity profile on the screen?`,
        options: options,
        mainImage: "assets/images/SS_table.png",
        correctAnswer: correctOpt,
        explanation: 
        ``,
        ShowImage: false,
    };

};


//MULTIPLE SLIT (DIFFRACTION GRATING)
function MS_changeGratingQuestions() {
    const isIncrease = getRandomInt(0, 1); //Increase slit separation between gratings if 1 else 0

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
        ShowImage: false,
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
        ShowImage: false,
    };

};




//GENERATING QUESTIONS
function GenQuestion() {
    randomQuestion = getRandomInt(0, 9)
    if (randomQuestion === 0) {
        return phaseDiffQuestions();

    } else if (randomQuestion === 1) {
        return pathDiffQuestions();

    } else if (randomQuestion === 2) {
        return possPhaseDiffQuestions();

    } else if (randomQuestion === 3) {
        return DS_WavelengthQuestions();

    } else if (randomQuestion === 4) {
        return DS_SlitSeparationQuestions(); 

    } else if (randomQuestion === 5){
        return DS_ScreenDistanceQuestions();

    } else if (randomQuestion === 6) {
        return SS_changeSlitWidthQuestions();

    } else if (randomQuestion === 7) {
        return SS_changeWaveLengthQuestions();

    } else if (randomQuestion === 8) {
        return MS_changeGratingQuestions();

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
