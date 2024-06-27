import {Simulation} from "./index.js";
import {Screen} from "../shared/screen.js";
import {interpolate, w2h} from "../utils/color.js";
import {distance} from "../utils/math.js";
import {DoubleSlit, NSlit, Slit} from "../shared/slit.js";

class NSlitSimulation extends Simulation {
    constructor(cvs, c, wavelength = 500 / 1_000_000_000 , slitWidth = 500 / 1_000_000, slitSeparation = 50 / 1_000_000, slits = 3) {
        super(cvs, c);
        this.wavelength = wavelength;
        this.screen = new Screen(cvs, c, 0.85 * cvs.width, cvs.height / 2, cvs.height - 50);
        this.slit = new NSlit(cvs, c, 0.15 * cvs.width, cvs.height / 2, cvs.height - 50, slitWidth / this.ypx2m, slitSeparation / this.ypx2m, slits);

        this.t = 0;
        this.dt = 1 / 60;
        this.cache = {};
        this.redraw = true;
    }

    evaluate = (theta) => {
        theta = Math.round(theta * 1_000_000) / 1_000_000;
        if (theta in this.cache) return this.cache[theta];
        let sine = Math.sin(theta);
        let beta = Math.PI * this.slit.width * this.ypx2m * sine / this.wavelength;
        let alpha = Math.PI * (this.slit.width + this.slit.separation) * this.ypx2m * sine / this.wavelength;
        let tmp = Math.sin(beta) / beta * Math.sin(this.slit.slits * alpha) / Math.sin(alpha);
        this.cache[theta] = tmp * tmp / this.slit.slits / this.slit.slits;
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
            const theta = Math.atan2((y - this.slit.y) * this.ypx2m, (this.screen.x - this.slit.x) * this.xpx2m);
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
        const dist = Math.round((this.screen.x - this.slit.x) * this.xpx2m * 1000) / 10;
        this.c.fillText(`${dist} cm`, 0, 10);
        this.c.restore();
    }

    setWavelength = (wavelength) => {
        this.wavelength = wavelength;
        this.redraw = true;
        this.cache = {};
    }

    setSlitWidth = (slitWidth) => {
        this.slit.width = slitWidth / this.ypx2m;
        this.redraw = true;
        this.cache = {};
    }

    setSlitSeparation = (slitSeparation) => {
        this.slit.separation = slitSeparation / this.ypx2m;
        this.redraw = true;
        this.cache = {};
    }

    setSlits = (slits) => {
        this.slit.slits = slits;
        this.redraw = true;
        this.cache = {};
    }

    intensityAt = (x, y) => {
        if (x < this.slit.x) return 1;
        const theta = Math.atan2((y - this.slit.y) * this.ypx2m, (x - this.slit.x) * this.xpx2m);
        return this.evaluate(theta);
    }

    colorAt = (x, y) => {
        const dist = (x < this.slit.x ? x : distance(this.slit.x, this.slit.y, x , y));
        const v = 2 * dist / (this.wavelength * 50000000) - 10 * this.t;
        const factor = (1 + Math.cos(v)) / 2;
        return interpolate("#000000", this.color, factor);
    }

    mouseDown = (event) => {};

    mouseUp = (event) => {};

    mouseMove = (event, x, y) => {
        this.screen.x = Math.max(Math.min(x, this.screen.maxX), this.screen.minX);
        this.redraw = true;
    }

    get xpx2m() {
        return 2 / (this.screen.maxX - this.slit.x);
    }

    get ypx2m() {
        return 1 / 1_000_00;
    }

    get color() {
        return w2h(this.wavelength);
    }
}

export { NSlitSimulation };