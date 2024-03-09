import { InterferenceSimulation } from "./simulations/interference.js";

const fps = 60;

const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');
const frequencyInput = document.getElementById("frequencyInput");
const amplitudeInput = document.getElementById("amplitudeInput");
const pathDifference = document.getElementById("pathDifference");
const phaseDifference = document.getElementById("phaseDifference");
const interference = document.getElementById("interference");

const simulation = new InterferenceSimulation(cvs, c, frequencyInput.value, amplitudeInput.value);
simulation.wave1.waveTopColor = "#e1503c";
simulation.wave1.waveBottomColor = "#ea887b";
simulation.wave2.waveTopColor = "#eea71f";
simulation.wave2.waveBottomColor = "#f4c671";

const animate = () => {
    c.clearRect(0, 0, cvs.width, cvs.height);
    simulation.update();

    const ep = 0.01
    pathDifference.innerText = `${simulation.pathDifference.toFixed(2)}`;
    phaseDifference.innerText = `${simulation.phaseDifference.toFixed(2)}`;
    if (Math.min(Math.abs(simulation.phaseDifference % 2), 2 - Math.abs(simulation.phaseDifference % 2)) < ep) {
        interference.innerText = "Constructive Interference!";
    } else if (Math.min(Math.abs((simulation.phaseDifference + 1) % 2), 2 - Math.abs((simulation.phaseDifference + 1) % 2)) < ep) {
        interference.innerText = "Destructive Interference!";
    } else interference.innerText = "Partial Interference"

    setTimeout(() => {
        requestAnimationFrame(animate);
    }, 1000 / fps);

}

frequencyInput.oninput = () => {
    document.getElementById("frequencyValue").innerText = frequencyInput.value;
    simulation.setFrequency(frequencyInput.value);
}

amplitudeInput.oninput = () => {
    document.getElementById("amplitudeValue").innerText = amplitudeInput.value;
    simulation.setAmplitude(amplitudeInput.value);
}

animate();