import {Simulation} from "./index.js";
import {Screen} from "../shared/screen.js";
import {i2h, interpolate, w2h} from "../utils/color.js";
import {distance} from "../utils/math.js";
import {DoubleSlit} from "../shared/slit.js";

class DoubleSlitSimulation extends Simulation {
    constructor(cvs, c, wavelength = 500 / 1_000_000_000 , slitWidth = 300 / 1_000_000, slitSeparation = 800 / 1_000_000) {
        super(cvs, c);
        this.wavelength = wavelength;
        this.slitWidth = slitWidth;
        this.slitSeparation = slitSeparation;
        this.envelope = 1;
        this.color = w2h(this.wavelength);

        this.t = 0;
        this.dt = 1 / 60;
        this.resize();
    }

    resize = () => {
        super.resize();
        this.screen = new Screen(this.cvs, this.c, 0.85 * this.cvs.width, this.cvs.height / 2, this.cvs.height * 0.95);
        this.slit = new DoubleSlit(this.cvs, this.c, 0.1 * this.cvs.width, this.cvs.height / 2, this.cvs.height * 0.95,
            this.slitWidth / this.ypx2m, (this.slitSeparation - this.slitWidth) / this.ypx2m);
        this.redraw = true;
        this.cache = {};
        this.cacheEnvelope = {};
    }

    evaluate = (theta) => {
        theta = Math.round(theta * 1_000_000) / 1_000_000;
        if (theta in this.cache) return this.cache[theta];
        const sine = Math.sin(theta);
        const cs = Math.cos(Math.PI * (this.slitSeparation) * sine / this.wavelength);
        const a = Math.PI * this.slitWidth * sine / this.wavelength
        const tmp = Math.sin(a) / a;
        this.cache[theta] = cs * cs * tmp * tmp;
        return this.cache[theta];
    }

    evaluateEnvelope = (theta) => {
        theta = Math.round(theta * 1_000_00) / 1_000_00;
        if (theta in this.cacheEnvelope) return this.cacheEnvelope[theta];
        let sine = Math.sin(theta);
        let a = Math.PI * this.slit.width * this.ypx2m * sine / this.wavelength;
        let tmp = Math.sin(a) / a;
        this.cacheEnvelope[theta] = tmp * tmp;
        return this.cacheEnvelope[theta];
    }

    update = () => {
        this.t += this.dt;

        if (this.redraw) {
            this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);
            this.screen.draw();
            this.slit.draw();
            this.plotIntensity();
            if (this.envelope) this.plotEnvelope();
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
        this.c.strokeStyle = i2h(this.color);
        for (let y = 0; y <= this.cvs.height; y++) {
            const theta = Math.atan2((y - this.slit.y) * this.ypx2m, (this.screen.x - this.slit.x) * this.xpx2m);
            const intensity =  this.evaluate(theta) * this.cvs.width / 10;
            if (y === 0) this.c.moveTo(this.screen.x + 5 + intensity, y);
            else this.c.lineTo(this.screen.x + 5 + intensity, y);
        }
        this.c.stroke();
    }

    plotEnvelope = () => {
        this.c.beginPath();
        this.c.lineWidth = 1;
        this.c.strokeStyle = "#FFFFFF";
        for (let y = 0; y <= this.cvs.height; y++) {
            const theta = Math.atan2((y - this.slit.y) * this.ypx2m, (this.screen.x - this.slit.x) * this.xpx2m);
            const intensity =  this.evaluateEnvelope(theta) * this.cvs.width / 10;
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
        this.c.lineWidth = 3;
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
        this.color = w2h(wavelength);
        this.redraw = true;
        this.cache = {};
        this.cacheEnvelope = {};
    }

    setSlitWidth = (slitWidth) => {
        this.slitWidth = slitWidth;
        this.slit.width = this.slitWidth / this.ypx2m;
        this.slit.separation = (this.slitSeparation - this.slitWidth) / this.ypx2m;
        this.redraw = true;
        this.cache = {};
        this.cacheEnvelope = {};
    }

    setSlitSeparation = (slitSeparation) => {
        this.slitSeparation = slitSeparation;
        this.slit.separation = (this.slitSeparation - this.slitWidth) / this.ypx2m;
        this.redraw = true;
        this.cache = {};
        this.cacheEnvelope = {};
    }

    setEnvelope = (envelope) => {
        this.envelope = envelope;
        this.redraw = true;
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
        return interpolate(0, this.color, factor);
    }

    mouseDown = (event) => {};

    mouseUp = (event) => {};

    mouseMove = (event, x, y) => {
        const prevX = this.screen.x;
        this.screen.x = Math.max(Math.min(x, this.screen.maxX), this.screen.minX);
        if (prevX === this.screen.x) return;
        this.redraw = true;
        this.cache = {};
    }

    get xpx2m() {
        return 2 / (this.screen.maxX - this.slit.x);
    }

    get ypx2m() {
        return 1 / 1_000_00;
    }
}

export { DoubleSlitSimulation };