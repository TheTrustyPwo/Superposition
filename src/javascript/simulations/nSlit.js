import {Simulation} from "./index.js";
import {HorizontalScreen} from "../shared/screen.js";
import {i2h, interpolate, w2h} from "../utils/color.js";
import {distance} from "../utils/math.js";
import {Grating} from "../shared/slit.js";

/*
 GratingSimulation (Option 2 - symbolic drawing)
 - density: lines per mm
 - beam width fixed to half canvas width
 - draw only up to MAX_DRAWN_SLITS for performance
*/

class GratingSimulation extends Simulation {
    constructor(cvs, c, density = 600, wavelength = 500e-9) {
        super(cvs, c);

        this.density = density;           
        this.wavelength = wavelength;     
        this.color = w2h(this.wavelength);

        this.t = 0;
        this.dt = 1 / 60;

        this.beamFraction = 0.5;

        this.redraw = true;
        this.cache = {};

        this.resize();
    }

    // center-to-center spacing
    get spacing() {
        return 1 / (this.density * 1e3);
    }

    // constant px→m scaling
    get xpx2m() { return 5 / 10000; }
    get ypx2m() { return 5 / 10000; }

    get illuminatedWidthPx() {
        return this.cvs.width * this.beamFraction;
    }

    get illuminatedWidthM() {
        return this.illuminatedWidthPx * this.xpx2m;
    }

    get totalSlits() {
        return Math.max(1, Math.floor(this.illuminatedWidthM / this.spacing));
    }

    evaluate = (theta) => {
     const key = Math.round(theta * 1e6) / 1e6;
     if (key in this.cache) return this.cache[key];

     const d = this.spacing;
     const lambda = this.wavelength;
     const N = this.totalSlits;

     // slit width: assume 1/10 of spacing if no explicit slit width parameter
     const b = d * 0.1;

     const sinT = Math.sin(theta);

     // ---- diffraction envelope ----
     const beta = Math.PI * b * sinT / lambda;
     const envelope = (Math.abs(beta) < 1e-12)
         ? 1
         : (Math.sin(beta) / beta) ** 2;

     // ---- interference pattern ----
     const alpha = Math.PI * d * sinT / lambda;
     const interference = (Math.abs(alpha) < 1e-12)
         ? N * N
         : (Math.sin(N * alpha) / Math.sin(alpha)) ** 2;

     // combine
     let I = envelope * interference;

     // normalize so max ≈ 1
     I = I / (N * N);

     this.cache[key] = I;
     return I;
  }


    resize = () => {
        super.resize();

        this.screen = new HorizontalScreen(
            this.cvs,
            this.c,
            this.cvs.width / 2,
            0.25 * this.cvs.height,
            this.cvs.width * 0.95
        );

        this.gratingY = 0.9 * this.cvs.height;
        this.gratingX = this.cvs.width / 2;

        const wPx = this.illuminatedWidthPx;
        this.grating = new Grating(this.cvs, this.c, this.gratingX, this.gratingY, wPx, this.density);

        this.screenDistanceM = (this.gratingY - this.screen.y) * this.ypx2m;

        this.redraw = true;
        this.cache = {};
    }

    // NEW — dragged screen updates physical distance
    setScreenY = (newY) => {
        this.screen.y = newY;
        this.screenDistanceM = (this.gratingY - this.screen.y) * this.ypx2m;

        this.redraw = true;
        this.cache = {};
    }

    update = () => {
        this.t += this.dt;

        if (this.redraw) {
            this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);
            this.screen.draw();
            this.grating.draw(this.xpx2m);
            this.plotIntensity();
            this.redraw = false;
        } else {
            this.c.clearRect(0, this.screen.y + 2.5, this.cvs.width, this.gratingY - this.screen.y - 5);
        }

        this.c.save();
        this.displayMeasurements();

        // coarse intensity field
        for (let x = 0; x <= this.cvs.width; x += 5) {
            for (let y = this.screen.y + 5; y <= this.cvs.height - 5; y += 5) {

                const dx = (x - this.gratingX) * this.xpx2m;
                const dy = (y - this.gratingY) * this.ypx2m;
                const theta = Math.atan(dx / this.screenDistanceM);

                this.c.globalAlpha = this.evaluate(theta);
                this.c.fillStyle = this.colorAt(x, y);
                this.c.fillRect(x, y, 3, 3);
            }
        }
        this.c.restore();
    }

    plotIntensity = () => {
        const ctx = this.c;
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = i2h(this.color);

        for (let x = 0; x <= this.cvs.width; x++) {
            const dx = (x - this.gratingX) * this.xpx2m;
            const theta = Math.atan(dx / this.screenDistanceM);
            const intensity = this.evaluate(theta) * this.cvs.height / 5;

            if (x === 0) ctx.moveTo(x, this.screen.y - 5 - intensity);
            else ctx.lineTo(x, this.screen.y - 5 - intensity);
        }
        ctx.stroke();
    }

    intensityAt = (x, y) => {
        if (y > this.gratingY) return 1;

        const dx = (x - this.gratingX) * this.xpx2m;
        const theta = Math.atan(dx / this.screenDistanceM);

        return this.evaluate(theta);
    }

    colorAt = (x, y) => {
        const dist = distance(this.gratingX, this.gratingY, x, y);
        const v = 2 * dist / (this.wavelength * 50000000) - 10 * this.t;
        const factor = (1 + Math.cos(v)) / 2;
        return interpolate(0, this.color, factor);
    }

    drawScreenView = (screenCtx, width, height) => {
        screenCtx.clearRect(0, 0, width, height);

        const leftEdgeX = this.screen.x - this.screen.w / 2;
        const rightEdgeX = this.screen.x + this.screen.w / 2;

        const minAngle = Math.atan((leftEdgeX - this.gratingX) * this.xpx2m / this.screenDistanceM);
        const maxAngle = Math.atan((rightEdgeX - this.gratingX) * this.xpx2m / this.screenDistanceM);

        for (let x = 0; x < width; x++) {
            const ratio = x / (width - 1);
            const theta = minAngle + ratio * (maxAngle - minAngle);
            const intensity = this.evaluate(theta);
            const color = interpolate(0, this.color, intensity);
            screenCtx.fillStyle = color;
            screenCtx.fillRect(x, 0, 1, height);
        }
    }

    setDensity = (density) => {
        this.density = Number(density);
        if (this.grating) this.grating.density = this.density;
        this.redraw = true;
        this.cache = {};
    }

    setWavelength = (wavelengthNm) => {
        this.wavelength = Number(wavelengthNm) / 1e9;
        this.color = w2h(this.wavelength);
        this.redraw = true;
        this.cache = {};
    }

    displayMeasurements = () => {
        this.c.save();
        this.c.beginPath();
        this.c.moveTo(this.cvs.width * 0.9, this.gratingY);
        this.c.lineTo(this.cvs.width * 0.9, this.screen.y);
        this.c.lineWidth = 3;
        this.c.strokeStyle = "#179e7e";
        this.c.stroke();

        this.c.translate(this.cvs.width * 0.9 + 40, (this.gratingY + this.screen.y) / 2);
        this.c.font = "20px arial";
        this.c.textAlign = "center";
        this.c.fillStyle = "#179e7e";

        const distCm = Math.round(this.screenDistanceM * 10000) / 10;
        this.c.fillText(`${distCm} cm`, 0, 10);

        this.c.fillText(`density: ${this.density} /mm`, 0, 40);
        this.c.fillText(`N (theoretical): ${this.totalSlits}`, 0, 70);

        this.c.restore();
    }
}

export { GratingSimulation };
