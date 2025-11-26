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

if (!cvs || !c) throw new Error("Canvas #nSlit not found");

const simulation = new GratingSimulation(cvs, c);

// set up small preview canvas size
if (screenViewCanvas && screenViewCtx) {
    screenViewCanvas.height = 40;
    screenViewCanvas.width = cvs.width;
}

// init UI values safely (guard nulls)
if (densityInput) {
    densityInput.value = simulation.density;
    densityValue.innerText = densityInput.value;
    densityInput.oninput = () => {
        densityValue.innerText = densityInput.value;
        simulation.setDensity(densityInput.value);
    };
}

if (wavelengthInput) {
    wavelengthInput.value = Math.round(simulation.wavelength * 1e9);
    wavelengthValue.innerText = wavelengthInput.value;
    wavelengthInput.oninput = () => {
        wavelengthValue.innerText = wavelengthInput.value;
        simulation.setWavelength(wavelengthInput.value);
    };
}

// optional distance control: if you have a distanceInput element, wire it
const distanceInput = document.getElementById("distanceInput");
const distanceValue = document.getElementById("distanceValue");
if (distanceInput) {
    distanceInput.value = Math.round(simulation.distanceToScreen * 100); // cm
    if (distanceValue) distanceValue.innerText = distanceInput.value;
    distanceInput.oninput = () => {
        const cm = Number(distanceInput.value);
        if (distanceValue) distanceValue.innerText = cm;
        simulation.setDistance(cm / 100);
    };
}

// animation loop
const animate = () => {
    simulation.update();
    if (screenViewCanvas && screenViewCtx) simulation.drawScreenView(screenViewCtx, screenViewCanvas.width, screenViewCanvas.height);
    setTimeout(() => requestAnimationFrame(animate), 1000 / fps);
};

animate();
