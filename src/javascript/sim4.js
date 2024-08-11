import { SingleSlitSimulation } from "./simulations/singleSlit.js"

const fps = 60;

const cvs = document.getElementById('singleSlit');
const c = cvs.getContext('2d');
const wavelengthInput = document.getElementById("wavelengthInput_SS");
const slitWidthInput = document.getElementById("slitWidthInput_SS");

const simulation = new SingleSlitSimulation(cvs, c);
const animate = () => {
    simulation.update();

    setTimeout(() => {
        requestAnimationFrame(animate);
    }, 1000 / fps);
}

wavelengthInput.oninput = () => {
    document.getElementById("wavelengthValue_SS").innerText = wavelengthInput.value;
    simulation.setWavelength(wavelengthInput.value / 1_000_000_000);
}

slitWidthInput.oninput = () => {
    document.getElementById("slitWidthValue_SS").innerText = slitWidthInput.value;
    simulation.setSlitWidth(slitWidthInput.value / 1_000_000);
}


animate()