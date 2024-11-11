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
function pathDiffConst_inPhase() {
    const p1 = getRandomInt(2, 10)
    const p2 = p1 + 1 * getRandomInt(1, 5)

    const pathDiff = p2 - p1
    const phaseDiff = pathDiff * 2

    const correctOpt = `Constructive Interference, Phase Difference Δϕ = ${phaseDiff}π`
    const wrongOpt1 = `Destructive Interference, Phase Difference Δϕ = ${phaseDiff}π`
    const wrongOpt2 = `Destructive Interference, Phase Difference Δϕ = ${pathDiff}π`
    const wrongOpt3 = `Constructive Interference, Phase Difference Δϕ = ${pathDiff}π`

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3])

    return {
        question: `Two sources emit coherent Sound waves in phase. If path 1 is ${p1}λ and path 2 is ${p2}λ from screen, What is their phase difference and interference type?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `The correct answer is ${correctOpt} because path difference = ${pathDiff}λ and phase difference = ${phaseDiff}π`,
    };
}

function pathDiffConst_inAntiphase() {
    const p1 = getRandomInt(2, 10)
    const p2 = p1 + 1 * getRandomInt(1, 5)

    const pathDiff = p2 - p1
    const phaseDiff = pathDiff * 2

    const wrongOpt1 = `Constructive Interference, Phase Difference Δϕ = ${phaseDiff}π`
    const correctOpt = `Destructive Interference, Phase Difference Δϕ = ${phaseDiff}π`
    const wrongOpt2 = `Destructive Interference, Phase Difference Δϕ = ${pathDiff}π`
    const wrongOpt3 = `Constructive Interference, Phase Difference Δϕ = ${pathDiff}π`

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3])

    return {
        question: `Two sources emit coherent sound waves in antiphase. If path 1 is ${p1}λ and path 2 is ${p2}λ from screen, What is their phase difference and interference type?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `The correct answer is ${correctOpt} because path difference = ${pathDiff}λ and phase difference = ${phaseDiff}π`,
    };
}

function pathDiffDest_inPhase() {
    const p1 = getRandomInt(2, 10)
    const p2 = p1 + 0.5 + getRandomInt(1, 5)

    const pathDiff = p2 - p1
    const phaseDiff = pathDiff * 2

    const wrongOpt1  = `Constructive Interference, Phase Difference Δϕ = ${phaseDiff}π`
    const correctOpt = `Destructive Interference, Phase Difference Δϕ = ${phaseDiff}π`
    const wrongOpt2 = `Destructive Interference, Phase Difference Δϕ = ${pathDiff}π`
    const wrongOpt3 = `Constructive Interference, Phase Difference Δϕ = ${pathDiff}π`

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3])

    return {
        question: `Two sources emit coherent sound waves in phase. If path 1 is ${p1}λ and path 2 is ${p2}λ from screen, What is their phase difference and interference type?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `The correct answer is ${correctOpt} because path difference = ${pathDiff}λ and phase difference = ${phaseDiff}π`,
    };

}

function pathDiffDest_inAntiphase() {
    const p1 = getRandomInt(2, 10)
    const p2 = p1 + 1 * getRandomInt(1, 5)

    const pathDiff = p2 - p1
    const phaseDiff = pathDiff * 2

    const correctOpt = `Constructive Interference, Phase Difference Δϕ = ${phaseDiff}π`
    const wrongOpt1 = `Destructive Interference, Phase Difference Δϕ = ${phaseDiff}π`
    const wrongOpt2 = `Destructive Interference, Phase Difference Δϕ = ${pathDiff}π`
    const wrongOpt3 = `Constructive Interference, Phase Difference Δϕ = ${pathDiff}π`

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3])

    return {
        question: `Two sources emit coherent Sound waves in antiphase. If path 1 is ${p1}λ and path 2 is ${p2}λ from screen, What is their phase difference and interference type?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `The correct answer is ${correctOpt} because path difference = ${pathDiff}λ and phase difference = ${phaseDiff}π`,
    };
}

function possDestPhaseDiff_inPhase() {
    const correctOpt = `π, 3π, 5π, ...`
    const wrongOpt1 = `2π, 4π, 6π, ...`
    const wrongOpt2 = `0, π, 2π, ...`
    const wrongOpt3 = `π/2, 3π/2, 5π/2, ...`

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3])

    return {
        question: `Which of the below lists the possible phase difference for destructive interference of two sound waves in phase?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `For desctructive interference, phase difference is always a positive odd number!`,
    };
}

function possDestPhaseDiff_inAntiphase() {
    const correctOpt = `0, 2π, 4π, ...`
    const wrongOpt1 = `π, 3π, 5π, ...`
    const wrongOpt2 = `0, π, 2π, ...`
    const wrongOpt3 = `π/2, 3π/2, 5π/2, ...`

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3])

    return {
        question: `Which of the below lists the possible phase difference for destructive interference of two sound waves in antiphase?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `For desctructive interference, phase difference is always a positive odd number!`,
    };
}

function possConstPhaseDiff_inPhase() {
    const correctOpt = `0, 2π, 4π, ...`
    const wrongOpt1 = `π, 3π, 5π, ...`
    const wrongOpt2 = `0, π, 2π, ...`
    const wrongOpt3 = `π/2, 3π/2, 5π/2, ...`

    const options = [correctOpt, wrongOpt1, wrongOpt2, wrongOpt3]
    for (let i = options.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i);
        [options[i], options[j]] = [options[j], options[i]];
    }

    return {
        question: `Which of the below lists the possible phase difference for constructive interference of two sound waves in phase?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `For constructive interference, phase difference is always zero or a postive even number!`,
    };
}

function possConstPhaseDiff_inAntiphase() {
    const correctOpt = `π, 3π, 5π, ...`
    const wrongOpt1 = `2π, 4π, 6π, ...`
    const wrongOpt2 = `0, π, 2π, ...`
    const wrongOpt3 = `π/2, 3π/2, 5π/2, ...`

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3])

    return {
        question: `Which of the below lists the possible phase difference for constructive interference of two sound waves in antiphase?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `For desctructive interference, phase difference is always a positive odd number!`,
    };
}


//SINGLE SLIT EXPERIMENTS
function SS_increaseSlitWidth() {
    const correctOpt = `The intensity increases while the spacing between maxima points doesn't change`
    const wrongOpt1 = `Only the spacing between maxima points increases`
    const wrongOpt2  = `Both the intensity and the spacing between maxima points increases`
    const wrongOpt3 = `Both the intensity and the spacing between maxima points decreases`
    const wrongOpt4 = `Only the spacing between maxima points decreases`
    const wrongOpt5 = `The intensity decreases while the spacing between maxima points increases`

    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `For a single slit experiment, if you increase the slit width, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because intensity is always constant and distance decreases!`,
    };
}

function SS_decreaseSlitWidth() {
    const wrongOpt1 = `Angle θ increases while the width of the width of Central Maxima decreases`
    const correctOpt = `Angle θ decreases while the width of the width of Central Maxima increases`
    const wrongOpt2  = `Angle θ increases while the width of the width of Central Maxima remains the same`
    const wrongOpt3 = `Angle θ decreases while the width of the width of Central Maxima remains the same`
    const wrongOpt4 = `Angle θ remains the same while the width of the width of Central Maxima increases`
    const wrongOpt5 = `Angle θ remains the smae while the width of the width of Central Maxima decreases`

    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `For a double slit, if you decrease the slit width, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because intensity is always constant and distance increases!`,
    };
}

function SS_increaseWaveLength() {
    const correctOpt = `Angle θ increases while the width of the width of Central Maxima decreases`
    const wrongOpt1 = `Angle θ decreases while the width of the width of Central Maxima increases`
    const wrongOpt2  = `Angle θ increases while the width of the width of Central Maxima remains the same`
    const wrongOpt3 = `Angle θ decreases while the width of the width of Central Maxima remains the same`
    const wrongOpt4 = `Angle θ remains the same while the width of the width of Central Maxima increases`
    const wrongOpt5 = `Angle θ remains the smae while the width of the width of Central Maxima decreases`

    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `For a single slit, if you increase the wavelength, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because wavelength is directly proportional to θ and inversely proportional to width of central maxima!`,
    };

}

function SS_decreaseWaveLength() {
    const wrongOpt1 = `Angle θ increases while the width of the width of Central Maxima decreases`
    const correctOpt = `Angle θ decreases while the width of the width of Central Maxima increases`
    const wrongOpt2  = `Angle θ increases while the width of the width of Central Maxima remains the same`
    const wrongOpt3 = `Angle θ decreases while the width of the width of Central Maxima remains the same`
    const wrongOpt4 = `Angle θ remains the same while the width of the width of Central Maxima increases`
    const wrongOpt5 = `Angle θ remains the smae while the width of the width of Central Maxima decreases`

    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `For a single slit, if you increase the wavelength, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because wavelength is directly proportional to θ and inversely proportional to width of central maxima!`,
    };

}





//DOUBLE SLIT EXPERIMENTS
function DS_increaseWaveLength() {
    const correctOpt = `Only the spacing between maxima points increases`
    const wrongOpt1 = `Only the spacing between maxima points decreases`
    const wrongOpt2  = `Both the intensity and the spacing between maxima points increases`
    const wrongOpt3 = `Both the intensity and the spacing between maxima points decreases`
    const wrongOpt4 = `The intensity increases while the spacing between maxima points decreases`
    const wrongOpt5 = `The intensity decreases while the spacing between maxima points increases`

    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `For a double slit, if you increase the wavelength, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because intensity is always constant and distance increases!`,
    };

}

function DS_decreaseWaveLength() {
    const correctOpt = `Only the spacing between maxima points decreases`
    const wrongOpt1 = `Only the spacing between maxima points increases`
    const wrongOpt2  = `Both the intensity and the spacing between maxima points increases`
    const wrongOpt3 = `Both the intensity and the spacing between maxima points decreases`
    const wrongOpt4 = `The intensity increases while the spacing between maxima points decreases`
    const wrongOpt5 = `The intensity decreases while the spacing between maxima points increases`

    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `For a double slit, if you decrease the wavelength, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ` ${correctOpt} because intensity is always constant and spacing decreases!`,
    };

}

function DS_increaseSlitSeparation() {
    const correctOpt = `Only the spacing between maxima points decreases`
    const wrongOpt1 = `Only the spacing between maxima points increases`
    const wrongOpt2  = `Both the intensity and the spacing between maxima points increases`
    const wrongOpt3 = `Both the intensity and the spacing between maxima points decreases`
    const wrongOpt4 = `The intensity increases while the spacing between maxima points decreases`
    const wrongOpt5 = `The intensity decreases while the spacing between maxima points increases`

    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `For a double slit, if you increase the slit separation, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because intensity is always constant and distance decreases!`,
    };

}

function DS_decreaseSlitSeparation() {
    const correctOpt = `Only the spacing between maxima points increases`
    const wrongOpt1 = `Only the spacing between maxima points decreases`
    const wrongOpt2  = `Both the intensity and the spacing between maxima points increases`
    const wrongOpt3 = `Both the intensity and the spacing between maxima points decreases`
    const wrongOpt4 = `The intensity increases while the spacing between maxima points decreases`
    const wrongOpt5 = `The intensity decreases while the spacing between maxima points increases`

    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `For a double slit, if you decrease the slit separation, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because intensity is always constant and distance increases!`,
    };

}


//MULTIPLE SLIT (DIFFRACTION GRATING)
function MS_increaseGrating(){
    const correctOpt = `The width of the intensity peaks decreases, while the intensity remains the same`
    const wrongOpt1 = `The width of the intensity peaks decreases, while the intensity decreases`
    const wrongOpt2  = `The width of the intensity peaks decreases, while the intensity increases`
    const wrongOpt3 = `The width of the intensity peaks increases, while the intensity remains the same`
    const wrongOpt4 = `The width of the intensity peaks increases, while the intensity decreases`
    const wrongOpt5 = `The width of the intensity peaks increases, while the intensity increases`

    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `For a diffraction grating, if you increase the number of gratings, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because intensity is always constant and width of the peaks are inversly proportional to number of grating!`,
    };


}

function MS_decreaseGrating(){
    const wrongOpt3 = `The width of the intensity peaks decreases, while the intensity remains the same`
    const wrongOpt1 = `The width of the intensity peaks decreases, while the intensity decreases`
    const wrongOpt2  = `The width of the intensity peaks decreases, while the intensity increases`
    const correctOpt = `The width of the intensity peaks increases, while the intensity remains the same`
    const wrongOpt4 = `The width of the intensity peaks increases, while the intensity decreases`
    const wrongOpt5 = `The width of the intensity peaks increases, while the intensity increases`

    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `For a diffraction grating, if you decrease the number of gratings, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because intensity is always constant and width of the peaks are inversly proportional to number of grating!`,
    };

}

function MS_increaseWavelength(){
    const correctOpt = `Angle θ increases and the fringe separation increases`
    const wrongOpt1 = `Angle θ increases while the fringe separation decreases`
    const wrongOpt2  = `Angle θ decreases while the fringe separation increases`
    const wrongOpt3 = `Angle θ decreases while the fringe separation decreases`
    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3]
    const options = shuffleOptions([correctOpt, ...wrongOpts])

    return {
        question: `For a diffraction grating, if you increase the wavelength, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because wavelength is directly proportional to angle θ and fringe separation!`,
    };
}

function MS_decreaseWavelength(){
    const wrongOpt1 = `Angle θ increases and the fringe separation increases`
    const wrongOpt3 = `Angle θ increases while the fringe separation decreases`
    const wrongOpt2  = `Angle θ decreases while the fringe separation increases`
    const correctOpt = `Angle θ decreases while the fringe separation decreases`
    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3]
    const options = shuffleOptions([correctOpt, ...wrongOpts])

    return {
        question: `For a diffraction grating, if you decrease the wavelength, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because wavelength is directly proportional to angle θ and fringe separation!`,
    };
}





//RANDOMISING THE QUESTIONS
function pathDiff_Questions(){
    rand = getRandomInt(0, 3)
    if (rand === 0) {
        return pathDiffConst_inAntiphase();
    } else if (rand === 1) {
        return pathDiffConst_inPhase();
    } else if (rand === 2) {
        return pathDiffDest_inAntiphase();
    } else {
        return pathDiffDest_inPhase();
    }
}

function possPhaseDiff_Questions(){
    rand = getRandomInt(0, 3)
    if (rand === 0) {
        return possConstPhaseDiff_inPhase();
    } else if (rand === 1) {
        return possDestPhaseDiff_inAntiphase();
    } else if (rand === 2) {
        return possDestPhaseDiff_inPhase();
    } else {
        return possConstPhaseDiff_inAntiphase();
    }

}

function DS_changeSlitSeparation_Questons(){
    if (getRandomInt(0, 1) === 1) {
        return DS_increaseSlitSeparation();
    } else {
        return DS_decreaseSlitSeparation();
    }
}

function DS_changeWavelength_Questions(){
    if (getRandomInt(0, 1) === 1) {
        return DS_decreaseWaveLength();
    } else {
        return DS_increaseWaveLength();
    }
}

function SS_changeSlitWidth_Questions(){
    if (getRandomInt(0, 1) === 1) {
        return SS_increaseSlitWidth();
    } else {
        return SS_decreaseSlitWidth();
    }
}

function SS_changeWavelength_Questions(){
    if (getRandomInt(0, 1) === 1) {
        return SS_decreaseWaveLength();
    } else {
        return SS_increaseWaveLength();
    }
}

function MS_changeGrating_Questions(){
    if (getRandomInt(0, 1) === 1) {
        return MS_decreaseGrating();
    } else {
        return MS_increaseGrating();
    }
}

function MS_changeWavelength_Questions(){
    if (getRandomInt(0, 1) === 1) {
        return MS_decreaseWavelength();
    } else {
        return MS_increaseWavelength();
    }
}

//GENERATING QUESTIONS
function GenQuestion() {
    randomQuestion = getRandomInt(0, 8)
    if (randomQuestion === 0) {
        return lightColor();

    } else if (randomQuestion === 1) {
        return pathDiff_Questions();

    } else if (randomQuestion === 2) {
        return possPhaseDiff_Questions();

    } else if (randomQuestion === 3) {
        return DS_changeSlitSeparation_Questons();

    } else if (randomQuestion === 4){
        return DS_changeWavelength_Questions();

    } else if (randomQuestion === 5) {
        return SS_changeSlitWidth_Questions();

    } else if (randomQuestion === 6) {
        return SS_changeWavelength_Questions();

    } else if (randomQuestion === 7) {
        return MS_changeGrating_Questions();

    } else {
         return MS_changeWavelength_Questions();
    }

}

// Function to generate a set of random questions
function generateRandomQuestions(numQuestions) {
    const questions = [];
    for (let i = 0; i < numQuestions; i++) {
        questions.push(GenQuestion())
    }
    return questions;
}
