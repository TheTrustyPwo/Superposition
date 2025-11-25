import { Simulation } from "./index.js";
import { HorizontalScreen } from "../shared/screen.js";
import { i2h, interpolate, w2h } from "../utils/color.js";
import { distance } from "../utils/math.js";

class GratingSimulation extends Simulation {

    constructor(
        cvs,
        c,
        wavelength = 500e-9,     // 500 nm
        density = 300,           // slits per mm
        slitWidth = 2e-6,        // physical slit width (2 microns)
        distanceToScreen = 0.2   // 20 cm
    ) {
        super(cvs, c);

        this.wavelength = wavelength;
        this.density = density;                  // slits/mm
        this.slitWidth = slitWidth;              // meters
        this.distanceToScreen = distanceToScreen; // meters

        this.color = w2h(this.wavelength);

        this.cache = {};
        this.cacheEnvelope = {};
        this.t = 0;
        this.dt = 1 / 60;

        this.resize();
    }

    resize = () => {
        super.resize();

        // Screen at top area
        this.screen = new HorizontalScreen(
            this.cvs,
            this.c,
            this.cvs.width / 2,
            0.25 * this.cvs.height,
            this.cvs.width * 0.95
        );

        // Beam width = HALF of canvas width (fixed requirement)
        this.beamWidthPx = this.cvs.width * 0.5;
        this.beamWidthMeters = this.beamWidthPx * this.xpx2m;

        // Compute total slits inside the beam
        this.slitsPerMeter = this.density * 1000;   // slits/mm → slits/m
        this.slitSpacing = 1 / this.slitsPerMeter;  // center-to-center spacing (meters)

        this.totalSlits = Math.floor(this.beamWidthMeters / this.slitSpacing);

        // Center slit array around canvas midpoint
        this.slitX = this.cvs.width / 2;
        this.slitY = this.cvs.height * 0.9;

        this.redraw = true;
        this.cache = {};
        this.cacheEnvelope = {};
    };

    /* -----------------------------
        OPTICS CALCULATIONS
    ------------------------------*/

    evaluate = (theta) => {
        if (theta === 0) return 1;

        // Cache
        const key = Math.round(theta * 1e6);
        if (this.cache[key] !== undefined) return this.cache[key];

        const lambda = this.wavelength;
        const b = this.slitWidth;
        const d = this.slitSpacing;
        const N = this.totalSlits;

        const sinθ = Math.sin(theta);

        const beta = Math.PI * b * sinθ / lambda;
        const alpha = Math.PI * d * sinθ / lambda;

        const single = beta === 0 ? 1 : Math.sin(beta) / beta;
        const multi = alpha === 0 ? N : Math.sin(N * alpha) / Math.sin(alpha);

        const I = (single * multi / N) ** 2;

        this.cache[key] = I;
        return I;
    };

    evaluateEnvelope = (theta) => {
        if (theta === 0) return 1;

        const key = Math.round(theta * 1e6);
        if (this.cacheEnvelope[key]) return this.cacheEnvelope[key];

        const lambda = this.wavelength;
        const b = this.slitWidth;
        const sinθ = Math.sin(theta);
        const beta = Math.PI * b * sinθ / lambda;

        const env = beta === 0 ? 1 : (Math.sin(beta) / beta) ** 2;
        this.cacheEnvelope[key] = env;

        return env;
    };

    /* -----------------------------
        DRAWING
    ------------------------------*/

    drawSlits = () => {
        const ctx = this.c;
        ctx.beginPath();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;

        const pxSpacing = this.slitSpacing / this.xpx2m;
        const pxWidth = this.slitWidth / this.xpx2m;

        let start = this.slitX - (this.totalSlits * pxSpacing) / 2;

        for (let i = 0; i < this.totalSlits; i++) {
            let x = start + i * pxSpacing;
            // Draw the slit (gap)
            ctx.moveTo(x - pxWidth / 2, this.slitY);
            ctx.lineTo(x + pxWidth / 2, this.slitY);
        }

        ctx.stroke();
    };

    /* -----------------------------
        ANGLE CALCULATION
    ------------------------------*/

    getTheta = (x) => {
        const dx_m = (x - this.slitX) * this.xpx2m;
        return Math.atan(dx_m / this.distanceToScreen);
    };

    /* -----------------------------
        RENDERING LOOP
    ------------------------------*/

    update = () => {
        this.t += this.dt;

        // If something changed, redraw full scene
        if (this.redraw) {
            this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);

            this.screen.draw();
            this.drawSlits();
            this.plotIntensity();
            this.plotEnvelope();

            this.redraw = false;
        }

        // Render brightness field below slits
        this.renderField();
    };

    plotIntensity = () => {
        const ctx = this.c;
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = i2h(this.color);

        for (let x = 0; x <= this.cvs.width; x++) {
            const theta = this.getTheta(x);
            const I = this.evaluate(theta);
            const y = this.screen.y - 10 - I * (this.cvs.height * 0.2);

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.stroke();
    };

    plotEnvelope = () => {
        const ctx = this.c;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#ffffff";

        for (let x = 0; x < this.cvs.width; x++) {
            const theta = this.getTheta(x);
            const I = this.evaluateEnvelope(theta);
            const y = this.screen.y - 10 - I * (this.cvs.height * 0.2);

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.stroke();
    };

    renderField = () => {
        for (let x = 0; x <= this.cvs.width; x += 5) {
            for (let y = this.screen.y + 10; y <= this.cvs.height; y += 5) {
                const theta = this.getTheta(x);
                const I = this.evaluate(theta);

                this.c.globalAlpha = I;
                this.c.fillStyle = this.color;
                this.c.fillRect(x, y, 4, 4);
            }
        }
        this.c.globalAlpha = 1;
    };

    /* -----------------------------
        PARAMETER SETTERS
    ------------------------------*/

    setWavelength = (λ) => {
        this.wavelength = λ;
        this.color = w2h(λ);
        this.redraw = true;
        this.cache = {};
        this.cacheEnvelope = {};
    };

    setDensity = (slitsPerMM) => {
        this.density = slitsPerMM;
        this.resize();
    };

    setDistance = (distMeters) => {
        this.distanceToScreen = distMeters;
        this.redraw = true;
        this.cache = {};
    };

    /* -----------------------------
        PIXEL → METER SCALING
    ------------------------------*/

    get xpx2m() {
        return 5e-5;  // 0.00005 m per pixel horizontally
    }
    get ypx2m() {
        return 5e-5;
    }
}

export { GratingSimulation };

