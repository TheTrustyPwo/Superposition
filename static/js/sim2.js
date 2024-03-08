import { WaveDisplay } from "./shared/waves.js";
import { Pointer, createPointer } from "./shared/pointer.js";

const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');
const frequencyInput = document.getElementById("frequencyInput");
const amplitudeInput = document.getElementById("amplitudeInput");

const s1 = new WaveDisplay(cvs, c);
s1.setRect(100, 0.3 * cvs.height, cvs.width - 100, 0.5 * cvs.height);
s1.frequency = 0.5;
s1.amplitude = 0.2

const s2 = new WaveDisplay(cvs, c);
s2.setRect(100, 0.7 * cvs.height, cvs.width - 100, 0.5 * cvs.height);
s2.frequency = 0.5;
s2.amplitude = 0.2;

const pointer = new Pointer(cvs, c, cvs.width - 80, 0.5 * cvs.height);
createPointer(pointer);
const animate = () => {
    requestAnimationFrame(animate)
    c.clearRect(0, 0, cvs.width, cvs.height);
    s1.update();
    s2.update();
    s1.setRect(100, 0.3 * cvs.height, pointer.x - 30, pointer.y);
    s2.setRect(100, 0.7 * cvs.height, pointer.x - 30, pointer.y);
    pointer.draw();
}

frequencyInput.oninput = () => {
    document.getElementById("frequencyValue").innerText = frequencyInput.value;
    s1.frequency = frequencyInput.value;
    s2.frequency = frequencyInput.value;
}

amplitudeInput.oninput = () => {
    document.getElementById("amplitudeInput").innerText = amplitudeInput.value;
    s1.amplitude = amplitudeInput.value;
    s2.amplitude = amplitudeInput.value;
}

animate();