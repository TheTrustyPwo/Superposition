// sim6.js
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
