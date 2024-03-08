import { WaveDisplay } from "./shared/waves.js";
import { Pointer, createPointer } from "./shared/pointer.js";

const fps = 60;

const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');
const frequencyInput = document.getElementById("frequencyInput");
const amplitudeInput = document.getElementById("amplitudeInput");
const pathDifference = document.getElementById("pathDifference");
const phaseDifference = document.getElementById("phaseDifference");
const interference = document.getElementById("interference");

const s1 = new WaveDisplay(cvs, c);
s1.setRect(100, 0.1 * cvs.height, cvs.width - 200, 0.5 * cvs.height);
s1.frequency = 1.0;
s1.amplitude = 0.2
s1.waveTopColor = "#e1503c";
s1.waveBottomColor = "#ea887b";

const s2 = new WaveDisplay(cvs, c);
s2.setRect(100, 0.9 * cvs.height, cvs.width - 200, 0.5 * cvs.height);
s2.frequency = 1.0;
s2.amplitude = 0.2;
s2.waveTopColor = "#eea71f";
s2.waveBottomColor = "#f4c671";

const pointer = new Pointer(cvs, c, cvs.width - 180, 0.5 * cvs.height);

createPointer(pointer);
const animate = () => {
    c.clearRect(0, 0, cvs.width, cvs.height);
    s1.update();
    s2.update();
    s1.setRect(100, 0.3 * cvs.height, pointer.x - 20, pointer.y);
    s2.setRect(100, 0.7 * cvs.height, pointer.x - 20, pointer.y);
    s1.drawWavelength(1);
    s2.drawWavelength(0);
    pointer.draw();

    const pathDiff = Math.abs(s1.distance / s1.wavelength - s2.distance / s2.wavelength)
    const phaseDiff = 2 * pathDiff;
    const ep = 0.01
    pathDifference.innerText = `${pathDiff.toFixed(2)}`;
    phaseDifference.innerText = `${phaseDiff.toFixed(2)}`;
    if (Math.abs(phaseDiff) < ep || Math.abs(phaseDiff - 2) < ep) {
        interference.innerText = "Constructive Interference!";
    } else if (Math.abs(phaseDiff - 1) < ep) {
        interference.innerText = "Destructive Interference!";
    } else interference.innerText = "Partial Interference"

    setTimeout(() => {
        requestAnimationFrame(animate);
    }, 1000 / fps);

}

frequencyInput.oninput = () => {
    document.getElementById("frequencyValue").innerText = frequencyInput.value;
    s1.frequency = frequencyInput.value;
    s2.frequency = frequencyInput.value;
}

amplitudeInput.oninput = () => {
    document.getElementById("amplitudeValue").innerText = amplitudeInput.value;
    s1.amplitude = amplitudeInput.value;
    s2.amplitude = amplitudeInput.value;
}

animate();