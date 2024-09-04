import {Simulation} from "./index.js";
import {HorizontalScreen} from "../shared/screen.js";
import {i2h, interpolate, w2h} from "../utils/color.js";
import {distance} from "../utils/math.js";
import {NSlit} from "../shared/slit.js";

class NSlitSimulation extends Simulation {
    constructor(cvs, c, wavelength = 500 / 1_000_000_000 , slitWidth = 3 / 1_000_000, slitSeparation = 8 / 1_000_000, slits = 3) {
        super(cvs, c);
        this.wavelength = wavelength;
        this.slitWidth = slitWidth;
        this.slitSeparation = slitSeparation;
        this.slits = slits;
        this.envelope = 1;
        this.color = w2h(this.wavelength);

        this.t = 0;
        this.dt = 1 / 60;
        this.resize();
    }

    resize = () => {
        super.resize();
        this.screen = new HorizontalScreen(this.cvs, this.c, this.cvs.width / 2, 0.25 * this.cvs.height, this.cvs.width * 0.95);
        this.slit = new NSlit(this.cvs, this.c, this.cvs.width / 2, 0.9 * this.cvs.height, this.cvs.width * 0.95,
            this.slitWidth / this.xpx2m, (this.slitSeparation - this.slitWidth) / this.xpx2m, this.slits);
        this.redraw = true;
        this.cache = {};
        this.cacheEnvelope = {};
    }

    evaluate = (theta) => {
        if (theta === 0) return 1;
        theta = Math.round(theta * 1_000_0) / 1_000_0;
        if (theta in this.cache) return this.cache[theta];
        let sine = Math.sin(theta);
        let beta = Math.PI * this.slitWidth * sine / this.wavelength;
        let alpha = Math.PI * this.slitSeparation * sine / this.wavelength;
        let tmp = Math.sin(beta) / beta * Math.sin(this.slit.slits * alpha) / Math.sin(alpha) / this.slit.slits
        this.cache[theta] = tmp * tmp;
        return this.cache[theta];
    }

    evaluateEnvelope = (theta) => {
        theta = Math.round(theta * 1_000_00) / 1_000_00;
        if (theta in this.cacheEnvelope) return this.cacheEnvelope[theta];
        let sine = Math.sin(theta);
        let a = Math.PI * this.slit.width * this.xpx2m * sine / this.wavelength;
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
        } else this.c.clearRect(0, this.screen.y + 2.5, this.cvs.width, this.slit.y - this.screen.y - 5);


        this.c.save();
        this.displayMeasurements();
        for (let x = 0; x <= this.cvs.width; x += 5) {
            for (let y = this.screen.y + 5; y <= this.cvs.height - 5; y += 5) {
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
        for (let x = 0; x <= this.cvs.width; x++) {
            const theta = Math.atan2((x - this.slit.x) * this.xpx2m, (this.slit.y - this.screen.y) * this.ypx2m);
            const intensity =  this.evaluate(theta) * this.cvs.height / 5;
            if (x === 0) this.c.moveTo(x, this.screen.y - 5 - intensity);
            else this.c.lineTo(x, this.screen.y - 5 - intensity);
        }
        this.c.stroke();
    }

    plotEnvelope = () => {
        this.c.beginPath();
        this.c.lineWidth = 1;
        this.c.strokeStyle = "#FFFFFF";
        for (let x = 0; x <= this.cvs.width; x++) {
            const theta = Math.atan2((x - this.slit.x) * this.xpx2m, (this.slit.y - this.screen.y) * this.ypx2m);
            const intensity =  this.evaluateEnvelope(theta) * this.cvs.height / 5;
            if (x === 0) this.c.moveTo(x, this.screen.y - 5 - intensity);
            else this.c.lineTo(x, this.screen.y - 5 - intensity);
        }
        this.c.stroke();
    }

    displayMeasurements = () => {
        this.c.save();
        this.c.beginPath();
        this.c.moveTo(this.cvs.width * 0.9, this.slit.y);
        this.c.lineTo(this.cvs.width * 0.9, this.screen.y);
        this.c.lineWidth = 3;
        this.c.strokeStyle = "#179e7e";
        this.c.stroke();
        this.c.translate(this.cvs.width * 0.9 + 40, (this.slit.y + this.screen.y) / 2);
        this.c.font = "20px arial";
        this.c.textAlign = "center";
        this.c.fillStyle = "#179e7e";
        const dist = Math.round((this.slit.y - this.screen.y) * this.ypx2m * 1000) / 10;
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
        this.slit.width = slitWidth / this.xpx2m;
        this.slit.separation = (this.slitSeparation - this.slitWidth) / this.xpx2m;
        this.redraw = true;
        this.cache = {};
        this.cacheEnvelope = {};
    }

    setSlitSeparation = (slitSeparation) => {
        this.slitSeparation = slitSeparation;
        this.slit.separation = (this.slitSeparation - this.slitWidth) / this.xpx2m;
        this.redraw = true;
        this.cache = {};
        this.cacheEnvelope = {};
    }

    setSlits = (slits) => {
        this.slits = slits;
        this.slit.slits = slits;
        this.redraw = true;
        this.cache = {};
        this.cacheEnvelope = {};
    }

    setEnvelope = (envelope) => {
        this.envelope = envelope;
        this.redraw = true;
    }

    intensityAt = (x, y) => {
        if (y > this.slit.y) return 1;
        const theta = Math.atan2((x - this.slit.x) * this.xpx2m, (y - this.slit.y) * this.ypx2m);
        return this.evaluate(theta);
    }

    colorAt = (x, y) => {
        const dist = (y > this.slit.y ? this.cvs.height - y : distance(this.slit.x, this.slit.y, x, y));
        const v = 2 * dist / (this.wavelength * 50000000) - 10 * this.t;
        const factor = (1 + Math.cos(v)) / 2;
        return interpolate(0, this.color, factor);
    }

    mouseDown = () => {};

    mouseUp = () => {};

    mouseMove = (event, x, y) => {
        const prevY = this.screen.y;
        this.screen.y = Math.max(Math.min(y, this.screen.maxY), this.screen.minY);
        if (prevY === this.screen.y) return;
        this.redraw = true;
        this.cache = {};
    }

    get xpx2m() {
        return 5 / 1_000_0;
    }

    get ypx2m() {
        return 2 / (this.slit.y - this.screen.minY);
    }
}

export { NSlitSimulation };