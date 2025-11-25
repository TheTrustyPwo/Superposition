import { GratingSimulation } from "./simulations/nSlit.js";

const fps = 60;

const cvs = document.getElementById('nSlit');
const c = cvs.getContext('2d');

const densityInput = document.getElementById("densityInput");
const densityValue = document.getElementById("densityValue");
const wavelengthInput = document.getElementById("wavelengthInput_nSlit");
const wavelengthValue = document.getElementById("wavelengthValue_nSlit");
const screenViewCanvas = document.getElementById("screen-view");
const screenViewCtx = screenViewCanvas?.getContext("2d");

// instantiate
const simulation = new GratingSimulation(cvs, c);

// setup initial UI state
screenViewCanvas.height = 40;
screenViewCanvas.width = cvs.width;

densityInput.value = simulation.density;
densityValue.innerText = densityInput.value;

wavelengthValue.innerText = (simulation.wavelength * 1e9).toFixed(0);
wavelengthInput.value = (simulation.wavelength * 1e9).toFixed(0);

//
// ─── DRAGGABLE SCREEN ─────────────────────────────────────────────
//

let dragging = false;
let dragOffset = 0;

cvs.addEventListener("mousedown", (e) => {
    const rect = cvs.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // detect click within 10px of screen line
    if (Math.abs(y - simulation.screen.y) < 10) {
        dragging = true;
        dragOffset = y - simulation.screen.y;
    }
});

cvs.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const rect = cvs.getBoundingClientRect();
    let y = e.clientY - rect.top - dragOffset;

    // limits: mid-height → just below grating
    const minY = cvs.height * 0.5;
    const maxY = simulation.gratingY - 50;

    y = Math.max(minY, Math.min(maxY, y));

    simulation.setScreenY(y);
});

cvs.addEventListener("mouseup", () => dragging = false);
cvs.addEventListener("mouseleave", () => dragging = false);

//
// ─── ANIMATION LOOP ─────────────────────────────────────────────
//

const animate = () => {
    simulation.update();

    if (screenViewCanvas && screenViewCtx) {
        simulation.drawScreenView(screenViewCtx, screenViewCanvas.width, screenViewCanvas.height);
    }

    setTimeout(() => requestAnimationFrame(animate), 1000 / fps);
}

densityInput.oninput = () => {
    densityValue.innerText = densityInput.value;
    simulation.setDensity(densityInput.value);
}

wavelengthInput.oninput = () => {
    wavelengthValue.innerText = wavelengthInput.value;
    simulation.setWavelength(wavelengthInput.value);
}

animate();
