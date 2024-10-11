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
    let wavelengths = [415, 473, 533, 585, 605, 685];
    let possibleColors = ['Violet', 'Blue', 'Green', 'Yellow', 'Orange', 'Red']
    let randNum = getRandomInt(0, 5);
    
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
        ShowImage: false
    };
}

function pathDiffConst() {
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
        question: `If path 1 is ${p1}λ and path 2 is ${p2}λ from screen, What is their phase difference and interference type?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `The correct answer is ${correctOpt} because path difference = ${pathDiff}λ and phase difference = ${phaseDiff}π`,
         ShowImage: false
    };
}

function pathDiffDest() {
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
        question: `If path 1 is ${p1}λ and path 2 is ${p2}λ from screen, What is their phase difference and interference type?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `The correct answer is ${correctOpt} because path difference = ${pathDiff}λ and phase difference = ${phaseDiff}π`,
        ShowImage: false
    };

}

function possDestPhaseDiff() {
    const correctOpt = `π, 3π, 5π, ...`
    const wrongOpt1 = `2π, 4π, 6π, ...`
    const wrongOpt2 = `0, 2π, 4π, ...`
    const wrongOpt3 = `±π, ±3π, ±5π, ...`

    const options = shuffleOptions([correctOpt, wrongOpt1, wrongOpt2, wrongOpt3])

    return {
        question: `Which of the below lists the possible phase difference for destructive interference?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `For desctructive interference, phase difference is always a positive odd number!`,
        ShowImage: false
    };
}

function possConstPhaseDiff() {
    const correctOpt = `0, 2π, 4π, ...`
    const wrongOpt1 = `2π, 4π, 6π, ...`
    const wrongOpt2 = `π, 3π, 5π, ...`
    const wrongOpt3 = `±π, ±3π, ±5π, ...`

    const options = [correctOpt, wrongOpt1, wrongOpt2, wrongOpt3]
    for (let i = options.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i);
        [options[i], options[j]] = [options[j], options[i]];
    }

    return {
        question: `Which of the below lists the possible phase difference for constructive interference?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `For constructive interference, phase difference is always zero or a postive even number!`,
        ShowImage: false
    };
}

function increaseSlitWidth() {
    const correctOpt = `The intensity increases while the spacing between maxima points decreases`
    const wrongOpt1 = `Only the spacing between maxima points increases`
    const wrongOpt2  = `Both the intensity and the spacing between maxima points increases`
    const wrongOpt3 = `Both the intensity and the spacing between maxima points decreases`
    const wrongOpt4 = `Only the spacing between maxima points decreases`
    const wrongOpt5 = `The intensity decreases while the spacing between maxima points increases`

    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `If you increase the slit width, what happens to the intensity profile? ?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because intensity is always constant and distance decreases!`,
        ShowImage: false
    };
}

function decreaseSlitWidth() {
    const correctOpt = `The intensity decreases while the spacing between maxima points increases`
    const wrongOpt1 = `Only the spacing between maxima points decreases`
    const wrongOpt2  = `Both the intensity and the spacing between maxima points increases`
    const wrongOpt3 = `Both the intensity and the spacing between maxima points decreases`
    const wrongOpt4 = `The intensity increases while the spacing between maxima points decreases`
    const wrongOpt5 = `Only the spacing between maxima points increases`

    
    const wrongOpts = [wrongOpt1, wrongOpt2, wrongOpt3, wrongOpt4, wrongOpt5]
    const shuffledWrongOpts = wrongOpts.sort(() => 0.5 - Math.random()).slice(0, 3);


    const options = shuffleOptions([correctOpt, ...shuffledWrongOpts])

    return {
        question: `If you decrease the slit width, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because intensity is always constant and distance increases!`,
        ShowImage: false
    };
}

function increaseWaveLength() {
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
        question: `If you increase the wavelength, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because intensity is always constant and distance increases!`,
        ShowImage: false
    };

}

function decreaseWaveLength() {
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
        question: `If you decrease the wavelength, what happens to the intensity profile? ?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        ` ${correctOpt} because intensity is always constant and spacing decreases!`,
        ShowImage: false
    };

}

function increaseSlitSeparation() {
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
        question: `If you increase the slit separation, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because intensity is always constant and distance decreases!`,
        ShowImage: false
    };

}

function decreaseSlitSeparation() {
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
        question: `If you decrease the slit separation, what happens to the intensity profile?`,
        options: options,
        correctAnswer: correctOpt,
        explanation: 
        `${correctOpt} because intensity is always constant and distance increases!`,
        ShowImage: false
    };

}

function changeSlitSeparation(){
    if (getRandomInt(0, 1) === 1) {
        return increaseSlitSeparation()
    } else {
        return decreaseSlitSeparation()
    }
}

function changeWaveLength(){
    if (getRandomInt(0, 1) === 1) {
        return decreaseWaveLength()
    } else {
        return increaseWaveLength()
    }
}

function changeSlitWidth(){
    if (getRandomInt(0, 1) === 1) {
        return increaseSlitWidth()
    } else {
        return decreaseSlitWidth()
    }
}

function GenQuestion() {
    randomQuestion = getRandomInt(0, 7)
    if (randomQuestion === 0) {
        return lightColor();
    } else if (randomQuestion === 1) {
        return pathDiffConst()
    } else if (randomQuestion === 2) {
        return pathDiffDest()
    } else if (randomQuestion === 3) {
        return possConstPhaseDiff()
    } else if (randomQuestion === 4){
        return possDestPhaseDiff()
    } else if (randomQuestion === 5) {
        return changeSlitSeparation()
    } else if (randomQuestion === 6) {
        return changeSlitWidth()
    } else if (randomQuestion === 7) {
        return changeWaveLength()
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
