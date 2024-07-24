import { WaveFrontDisplay } from "./shared/waves.js";

const fps = 60;

const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');
const frequencyInput = document.getElementById("frequencyInput");
const amplitudeInput = document.getElementById("amplitudeInput");
const pathDifference = document.getElementById("pathDifference");
const phaseDifference = document.getElementById("phaseDifference");
const interference = document.getElementById("interference");

const waveDisplay = new WaveFrontDisplay(cvs, c);

const animate = () => {
    c.clearRect(0, 0, cvs.width, cvs.height);
    waveDisplay.update();

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