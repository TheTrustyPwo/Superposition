import { WaveVectorDisplay } from "./shared/waves.js";

const fps = 60;

const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');
const frequencyInput = document.getElementById("frequencyInput");
const amplitudeInput = document.getElementById("amplitudeInput");

const waveDisplay = new WaveVectorDisplay(cvs, c);
waveDisplay.frequency = frequencyInput.value;
waveDisplay.amplitude = amplitudeInput.value;

const animate = () => {
    c.clearRect(0, 0, cvs.width, cvs.height);
    waveDisplay.update();

    setTimeout(() => {
        requestAnimationFrame(animate);
    }, 1000 / fps);
}

animate();

frequencyInput.oninput = () => {
    document.getElementById("frequencyValue").innerText = frequencyInput.value;
    waveDisplay.frequency = frequencyInput.value;
}

amplitudeInput.oninput = () => {
    document.getElementById("amplitudeInput").innerText = amplitudeInput.value;
    waveDisplay.amplitude = amplitudeInput.value;
}