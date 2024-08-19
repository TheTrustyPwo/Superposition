import { NSlitSimulation } from "./simulations/nSlit.js"

const fps = 60;

const cvs = document.getElementById('nSlit');
const c = cvs.getContext('2d');
const slitsInput = document.getElementById("slitsInput_nSlit");
const wavelengthInput = document.getElementById("wavelengthInput_nSlit");
const slitWidthInput = document.getElementById("slitWidthInput_nSlit");
const slitSeparationInput = document.getElementById("slitSeparationInput_nSlit");
const envelopeInput = document.getElementById("envelopeInput_nSlit");

const simulation = new NSlitSimulation(cvs, c)
const animate = () => {
    simulation.update();

    setTimeout(() => {
        requestAnimationFrame(animate);
    }, 1000 / fps);
}

wavelengthInput.oninput = () => {
    document.getElementById("wavelengthValue_nSlit").innerText = wavelengthInput.value;
    simulation.setWavelength(wavelengthInput.value / 1_000_000_000);
}

slitWidthInput.oninput = () => {
    document.getElementById("slitWidthValue_nSlit").innerText = slitWidthInput.value;
    simulation.setSlitWidth(slitWidthInput.value / 1_000_000);
}

slitSeparationInput.oninput = () => {
    document.getElementById("slitSeparationValue_nSlit").innerText = slitSeparationInput.value;
    simulation.setSlitSeparation(slitSeparationInput.value / 1_000_000);
}

slitsInput.oninput = () => {
    document.getElementById("slitsValue_nSlit").innerText = slitsInput.value;
    simulation.setSlits(slitsInput.value);
}

envelopeInput.oninput = () => {
    simulation.setEnvelope(envelopeInput.checked);
}


animate()