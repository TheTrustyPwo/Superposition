import { GratingSimulation } from "./simulations/nSlit.js";
import { GratingFFTSimulation } from "./simulations/nSlit.js";

const fps = 60;

const cvs = document.getElementById('nSlit');
const c = cvs?.getContext('2d');

if (!cvs || !c) {
    throw new Error("Canvas #nSlit not found in DOM");
}

const densityInput = document.getElementById("densityInput");
const densityValue = document.getElementById("densityValue");
const wavelengthInput = document.getElementById("wavelengthInput_nSlit");
const wavelengthValue = document.getElementById("wavelengthValue_nSlit");
const screenViewCanvas = document.getElementById("screen-view");
const screenViewCtx = screenViewCanvas?.getContext("2d");
const distanceInput = document.getElementById("distanceInput");
const distanceValue = document.getElementById("distanceValue");

// instantiate simulation
const simulation = new GratingFFTSimulation(cvs, c);

// setup preview canvas size
if (screenViewCanvas && screenViewCtx) {
    screenViewCanvas.height = 40;
    screenViewCanvas.width = cvs.width;
}

// initialize UI values with guards
if (densityInput) {
    densityInput.value = simulation.density;
    if (densityValue) densityValue.innerText = densityInput.value;
    densityInput.oninput = () => {
        const val = Number(densityInput.value);
        if (densityValue) densityValue.innerText = val;
        simulation.setDensity(val);
    };
}

if (wavelengthInput) {
    const nm = Math.round(simulation.wavelength * 1e9);
    wavelengthInput.value = nm;
    if (wavelengthValue) wavelengthValue.innerText = nm;
    wavelengthInput.oninput = () => {
        const val = Number(wavelengthInput.value);
        if (wavelengthValue) wavelengthValue.innerText = val;
        simulation.setWavelength(val);
    };
}

// distance slider: 100..200 cm mapped to 1.0..2.0 m
if (distanceInput) {
    const cm = Math.round(simulation.distanceToScreen * 100);
    distanceInput.value = cm;
    if (distanceValue) distanceValue.innerText = cm;
    distanceInput.oninput = () => {
        const val = Number(distanceInput.value);
        if (distanceValue) distanceValue.innerText = val;
        simulation.setDistance(val / 100.0);
    };
}

const animate = () => {
    simulation.update();
    if (screenViewCanvas && screenViewCtx) simulation.drawScreenView(screenViewCtx, screenViewCanvas.width, screenViewCanvas.height);
    setTimeout(() => requestAnimationFrame(animate), 1000 / fps);
};

animate();
