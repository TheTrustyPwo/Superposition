import {Simulation} from "./index.js";
import {Screen} from "../shared/screen.js";
import {interpolate} from "../utils/color.js";
import {distance} from "../utils/math.js";
import {DoubleSlit} from "../shared/slit.js";

class DoubleSlitSimulation extends Simulation {
    constructor(cvs, c, wavelength = 20) {
        super(cvs, c);
        this.wavelength = wavelength;
        this.screen = new Screen(cvs, c, 0.85 * cvs.width, cvs.height / 2, cvs.height - 50);
        this.slit = new DoubleSlit(cvs, c, 0.15 * cvs.width, cvs.height / 2, cvs.height - 50, 50, 100);

        this.waveColor1 = "#ce2b15";
        this.waveColor2 = "#000000";

        this.t = 0;
        this.dt = 1 / 60;

        this.cache = {}
    }

    evaluate = (theta) => {
        theta = Math.round(theta * 1000) / 1000;
        if (theta in this.cache) return this.cache[theta];
        const sine = Math.sin(theta);
        const cs = Math.cos(Math.PI * this.slit.separation * sine / this.wavelength);
        const tmp = Math.sin(Math.PI * this.slit.width * sine / this.wavelength) / (Math.PI * this.slit.width * sine / this.wavelength);
        this.cache[theta] = cs * cs * tmp * tmp;
        return this.cache[theta];
    }

    update = () => {
        this.t += this.dt;
        this.screen.draw();
        this.slit.draw();
        this.plotIntensity();

        this.c.save();
        for (let x = this.slit.x; x <= this.screen.x - 10; x += 5) {
            for (let y = 0; y <= this.cvs.height; y += 5) {
                const theta = Math.atan2(y - this.slit.y, x - this.slit.x);
                this.c.globalAlpha = Math.max(Math.min(1.5 * this.evaluate(theta), 1), 0.15);
                const dist = distance(this.slit.x, this.slit.y, x, y);
                this.c.fillStyle = interpolate(this.waveColor1, this.waveColor2, (1 + (Math.sin(dist / this.wavelength - 8 * this.t))) / 2);
                this.c.fillRect(x, y, 3, 3);
            }
        }
        this.c.restore();
    }

    plotIntensity = () => {
        this.c.beginPath();
        this.c.strokeStyle = "#d94444";
        this.c.lineWidth = 3;
        for (let y = 0; y <= this.cvs.height; y++) {
            const theta = Math.atan2(y - this.slit.y, this.screen.x - this.slit.x);
            const intensity =  this.evaluate(theta) * 100;
            if (y === 0) this.c.moveTo(this.screen.x + 5 + intensity, y);
            else this.c.lineTo(this.screen.x + 5 + intensity, y);
        }
        this.c.stroke();
    }

    setWavelength = (wavelength) => {
        this.wavelength = wavelength;
        this.cache = {};
    }

    setSlitWidth = (slitWidth) => {
        this.slit.width = slitWidth;
        this.cache = {};
    }

    setSlitSeparation = (slitSeparation) => {
        this.slit.separation = slitSeparation;
        this.cache = {};
    }

    mouseDown = (event) => {};

    mouseUp = (event) => {};

    mouseMove = (event, x, y) => {
        this.screen.x = Math.max(Math.min(x, this.screen.maxX), this.screen.minX);
    }
}

export { DoubleSlitSimulation };