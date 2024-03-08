import { WaveDisplay } from "./shared/waves.js";

const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');
const frequencyInput = document.getElementById("frequencyInput");
const amplitudeInput = document.getElementById("amplitudeInput");

const waveDisplay = new WaveDisplay(cvs, c);

const animate = () => {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, cvs.width, cvs.height);
    waveDisplay.update();
}

frequencyInput.oninput = () => {
    document.getElementById("frequencyValue").innerText = frequencyInput.value;
    waveDisplay.frequency = frequencyInput.value;
}

amplitudeInput.oninput = () => {
    document.getElementById("amplitudeInput").innerText = amplitudeInput.value;
    waveDisplay.amplitude = amplitudeInput.value;
}