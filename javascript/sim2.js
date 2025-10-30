import { InterferenceSimulation } from "./simulations/interference.js";

const fps = 60;

const cvs = document.getElementById('twoSourceInf');
const c = cvs.getContext('2d');
const wavelengthInput = document.getElementById("wavelengthInput_2SF");
const amplitudeInput = document.getElementById("amplitudeInput_2SF");
const lockScreenInput = document.getElementById("lockScreen");
const lockPointerInput = document.getElementById("lockPointer");
const pathDifference = document.getElementById("pathDifference_2SF");
const phaseDifference = document.getElementById("phaseDifference_2SF");
const interference = document.getElementById("interference_2SF");

const simulation = new InterferenceSimulation(cvs, c, wavelengthInput.value, amplitudeInput.value);
simulation.wave1.waveTopColor = "#e1503c";
simulation.wave1.waveBottomColor = "#ea887b";
simulation.wave2.waveTopColor = "#eea71f";
simulation.wave2.waveBottomColor = "#f4c671";

const animate = () => {
    c.clearRect(0, 0, simulation.screen.x, cvs.height);
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

wavelengthInput.oninput = () => {
    document.getElementById("wavelengthValue_2SF").innerText = wavelengthInput.value;
    simulation.setWavelength(wavelengthInput.value);
}

amplitudeInput.oninput = () => {
    document.getElementById("amplitudeValue_2SF").innerText = amplitudeInput.value;
    simulation.setAmplitude(amplitudeInput.value);
}

lockScreenInput.oninput = () => {
    simulation.lockScreen = lockScreenInput.checked;
}

lockPointerInput.oninput = () => {
    simulation.lockPointer = lockPointerInput.checked;
}

animate();