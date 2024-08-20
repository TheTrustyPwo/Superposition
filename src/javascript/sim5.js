import { DoubleSlitSimulation } from "./simulations/doubleSlit.js"

const fps = 60;

const cvs = document.getElementById('doubleSlit');
const c = cvs.getContext('2d');
const wavelengthInput = document.getElementById("wavelengthInput_DS");
const slitWidthInput = document.getElementById("slitWidthInput_DS");
const slitSeparationInput = document.getElementById("slitSeparationInput_DS");
const envelopeInput = document.getElementById("envelopeInput_DS");

const simulation = new DoubleSlitSimulation(cvs, c)
const animate = () => {
    simulation.update();

    setTimeout(() => {
        requestAnimationFrame(animate);
    }, 1000 / fps);
}

wavelengthInput.oninput = () => {
    document.getElementById("wavelengthValue_DS").innerText = wavelengthInput.value;
    simulation.setWavelength(wavelengthInput.value / 1_000_000_000);
}

slitWidthInput.oninput = () => {
    document.getElementById("slitWidthValue_DS").innerText = slitWidthInput.value;
    simulation.setSlitWidth(slitWidthInput.value / 1_000_000);
}

slitSeparationInput.onchange = (e) => {
    document.getElementById("slitSeparationValue_DS").innerText = slitSeparationInput.value;
    simulation.setSlitSeparation(slitSeparationInput.value / 1_000_000);
}

envelopeInput.oninput = () => {
    simulation.setEnvelope(envelopeInput.checked);
}


animate()