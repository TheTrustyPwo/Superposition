import {Simulation} from "./index.js";
import {Screen} from "../shared/screen.js";
import {interpolate, w2h} from "../utils/color.js";
import {distance} from "../utils/math.js";
import {Slit} from "../shared/slit.js";

class SingleSlitSimulation extends Simulation {
    constructor(cvs, c, wavelength = 500, slitWidth = 2000) {
        super(cvs, c);
        this.wavelength = wavelength;
        this.screen = new Screen(cvs, c, 0.85 * cvs.width, cvs.height / 2, cvs.height - 20);
        this.slit = new Slit(cvs, c, 0.15 * cvs.width, cvs.height / 2, cvs.height - 20, slitWidth / this.ypx2nm);

        this.t = 0;
        this.dt = 1 / 60;
        this.cache = {};
        this.redraw = true;
    }

    evaluate = (theta) => {
        theta = Math.round(theta * 1000) / 1000;
        if (theta in this.cache) return this.cache[theta];
        let sine = Math.sin(theta);
        let a = Math.PI * this.slit.width * this.ypx2nm * sine / this.wavelength;
        let tmp = Math.sin(a) / a;
        this.cache[theta] = tmp * tmp;
        return this.cache[theta];
    }

    update = () => {
        this.t += this.dt;

        if (this.redraw) {
            this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);
            this.screen.draw();
            this.slit.draw();
            this.plotIntensity();
            this.redraw = false;
        } else this.c.clearRect(this.slit.x + 2.5, 0, this.screen.x - this.slit.x - 5, this.cvs.height);

        this.c.save();
        this.displayMeasurements();
        for (let x = 0; x < this.screen.x - 3; x += 5) {
            for (let y = 0; y <= this.cvs.height; y += 5) {
                this.c.globalAlpha = this.intensityAt(x, y);
                this.c.fillStyle = this.colorAt(x, y);
                this.c.fillRect(x, y, 3, 3);
            }
        }
        this.c.restore();
    }

    plotIntensity = () => {
        this.c.beginPath();
        this.c.lineWidth = 3;
        this.c.strokeStyle = this.color;
        for (let y = 0; y <= this.cvs.height; y++) {
            const theta = Math.atan2((y - this.slit.y) * this.ypx2nm, (this.screen.x - this.slit.x) * this.xpx2nm);
            const intensity =  this.evaluate(theta) * 100;
            if (y === 0) this.c.moveTo(this.screen.x + 5 + intensity, y);
            else this.c.lineTo(this.screen.x + 5 + intensity, y);
        }
        this.c.stroke();
    }

    displayMeasurements = () => {
        this.c.save();
        this.c.beginPath();
        this.c.moveTo(this.slit.x, this.cvs.height * 0.9);
        this.c.lineTo(this.screen.x, this.cvs.height * 0.9);
        this.c.strokeStyle = "#179e7e";
        this.c.stroke();
        this.c.translate((this.slit.x + this.screen.x) / 2, this.cvs.height * 0.9 - 18);
        this.c.font = "20px arial";
        this.c.textAlign = "center";
        this.c.fillStyle = "#179e7e";
        this.c.fillText(`${(this.screen.x - this.slit.x) * this.xpx2nm} nm`, 0, 10);
        this.c.restore();
    }

    setWavelength = (wavelength) => {
        this.wavelength = wavelength;
        this.redraw = true;
        this.cache = {};
    }

    setSlitWidth = (slitWidth) => {
        this.slit.width = slitWidth / this.ypx2nm;
        this.redraw = true;
        this.cache = {};
    }

    mouseDown = (event) => {};

    mouseUp = (event) => {};

    mouseMove = (event, x, y) => {
        this.screen.x = Math.max(Math.min(x, this.screen.maxX), this.screen.minX);
        this.redraw = true;
    }

    intensityAt = (x, y) => {
        if (x < this.slit.x) return 1;
        const theta = Math.atan2((y - this.slit.y) * this.ypx2nm, (x - this.slit.x) * this.xpx2nm);
        let intensity = this.evaluate(theta);
        // Following line is unscientific, only for visual effects
        if (Math.abs(theta) > Math.asin(this.wavelength / this.slit.width / this.ypx2nm)) intensity *= 3;
        return intensity;
    }

    colorAt = (x, y) => {
        const dist = (x < this.slit.x ? x * this.xpx2nm : distance(this.slit.x * this.xpx2nm, this.slit.y * this.ypx2nm, x * this.xpx2nm, y * this.ypx2nm));
        const v = 2 * dist / this.wavelength - 10 * this.t;
        const factor = (1 + Math.cos(v)) / 2;
        return interpolate("#000000", this.color, factor);
    }

    get xpx2nm() {
        return 20;
    }

    get ypx2nm() {
        return 20;
    }

    get color() {
        return w2h(this.wavelength);
    }
}

export { SingleSlitSimulation };