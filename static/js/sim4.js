import { SingleSlitSimulation } from "./simulations/singleSlit.js"

const fps = 60;

const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');
const wavelengthInput = document.getElementById("wavelengthInput");
const slitWidthInput = document.getElementById("slitWidthInput");

const simulation = new SingleSlitSimulation(cvs, c, wavelengthInput.value, slitWidthInput.value * 1000);
const animate = () => {
    c.clearRect(0, 0, cvs.width, cvs.height);
    simulation.update();

    setTimeout(() => {
        requestAnimationFrame(animate);
    }, 1000 / fps);
}

wavelengthInput.oninput = () => {
    document.getElementById("wavelengthValue").innerText = wavelengthInput.value;
    simulation.setWavelength(wavelengthInput.value);
}

slitWidthInput.oninput = () => {
    document.getElementById("slitWidthValue").innerText = slitWidthInput.value;
    simulation.setSlitWidth(slitWidthInput.value * 1000);
}


animate()