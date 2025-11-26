import { Simulation } from "./index.js";
import { HorizontalScreen } from "../shared/screen.js";
import { i2h, interpolate, w2h } from "../utils/color.js";
import { distance } from "../utils/math.js";

class GratingSimulation extends Simulation {

    constructor(cvs, c, density = 600, wavelength = 500e-9, slitWidth = 2e-6, distanceToScreen = 2.0) {
        super(cvs, c);
        this.cvs = cvs;
        this.c = c;

        this.density = density;         // lines per mm
        this.wavelength = wavelength;   // meters
        this.slitWidth = slitWidth;     // meters
        this.distanceToScreen = distanceToScreen; // meters

        this.beamFraction = 0.5; // beam width fixed to half canvas width

        // FFT params
        this.fftSize = 16384; // power of two; large for high resolution; tune if perf issues
        this.window = null;

        this.color = w2h(this.wavelength);
        this.t = 0;
        this.dt = 1/60;

        this.redraw = true;
        this.cache = {};

        this.resize();
    }

    // px -> m scale (same mapping concept as before)
    get xpx2m() {
        return 5e-5; // 0.00005 m per pixel (tweak if needed)
    }

    resize = () => {
        super.resize();

        // screen area (top intensity preview)
        this.screen = {
            x: this.cvs.width / 2,
            y: Math.round(0.25 * this.cvs.height),
            w: Math.round(this.cvs.width * 0.95)
        };

        // grating coordinates
        this.gratingY = Math.round(this.cvs.height * 0.9);
        this.gratingX = Math.round(this.cvs.width / 2);

        // illuminated width in px = half canvas
        this.illuminatedWidthPx = Math.round(this.cvs.width * this.beamFraction);

        this.grating = new GratingFFT(this.cvs, this.c, this.gratingX, this.gratingY, this.illuminatedWidthPx, this.density, this.slitWidth);

        // rebuild window (simple rectangular window used; you can apply others)
        this.window = null;

        // regenerate FFT arrays
        this.aperture = this.grating.buildAperture(this.fftSize, this.xpx2m);
        this.fftRe = new Float32Array(this.fftSize);
        this.fftIm = new Float32Array(this.fftSize);

        this.redraw = true;
    }

    // ---------------- FFT implementation (iterative radix-2) ----------------
    // Input: real array 'real' (Float32Array), imag = Float32Array(fftSize) (zeroed)
    // Output: arrays mutated into complex spectrum
    fftComplex(real, imag) {
        const n = real.length;
        const levels = Math.log2(n);
        if (Math.floor(levels) !== levels) throw new Error("FFT size must be power of 2");

        // bit-reverse permutation
        let rev = new Uint32Array(n);
        for (let i = 0; i < n; i++) {
            let j = 0;
            for (let k = 0; k < levels; k++) j = (j << 1) | ((i >>> k) & 1);
            rev[i] = j;
        }
        for (let i = 0; i < n; i++) {
            const j = rev[i];
            if (j > i) {
                let tr = real[i], ti = imag[i];
                real[i] = real[j]; imag[i] = imag[j];
                real[j] = tr; imag[j] = ti;
            }
        }

        // Cooley-Tukey
        for (let size = 2; size <= n; size <<= 1) {
            const halfsize = size >>> 1;
            const tablestep = n / size;
            for (let i = 0; i < n; i += size) {
                for (let j = 0; j < halfsize; j++) {
                    const k = j * tablestep;
                    const angle = -2 * Math.PI * k / n;
                    const wr = Math.cos(angle), wi = Math.sin(angle);
                    const off = i + j, off2 = off + halfsize;
                    const xr = wr * real[off2] - wi * imag[off2];
                    const xi = wr * imag[off2] + wi * real[off2];

                    real[off2] = real[off] - xr;
                    imag[off2] = imag[off] - xi;
                    real[off] += xr;
                    imag[off] += xi;
                }
            }
        }
    }

    // compute far-field intensity by FFT of aperture (returns Float32Array length fftSize)
    computeFFTIntensity() {
        // copy aperture into re[] and zero imag[]
        const re = this.fftRe;
        const im = this.fftIm;
        re.set(this.aperture);
        im.fill(0);

        // apply window (optional) - currently no window
        this.fftComplex(re, im);

        // compute power spectrum (shifted)
        const N = this.fftSize;
        const spec = new Float32Array(N);
        // compute magnitudes and shift (center DC to middle)
        for (let i = 0; i < N; i++) {
            const mag = re[i]*re[i] + im[i]*im[i];
            // shifted index
            const j = (i + N/2) & (N-1);
            spec[j] = mag;
        }

        // normalize
        let max = 0;
        for (let i = 0; i < N; i++) if (spec[i] > max) max = spec[i];
        if (max > 0) {
            for (let i = 0; i < N; i++) spec[i] /= max;
        }

        return spec;
    }

    // map FFT bins to sin(theta) and then to screen x (canvas px)
    fftToScreen(spec) {
        const N = spec.length;
        const apertureMeters = this.illuminatedWidthPx * this.xpx2m;
        const dx = apertureMeters / N;              // sample spacing in meters
        // frequency axis fx = m / apertureWidth (cycles per meter)
        // bin k (centered) corresponds to fx = (k - N/2) / apertureWidthMeters
        const apertureWidthMeters = apertureMeters;

        const screenIntensity = new Float32Array(this.cvs.width);
        const screenColorFactor = new Float32Array(this.cvs.width);
        // zero
        screenIntensity.fill(0);

        for (let k = 0; k < N; k++) {
            const fx = (k - N/2) / apertureWidthMeters;   // cycles per meter
            const sinTheta = fx * this.wavelength;        // sinθ = λ * fx
            if (Math.abs(sinTheta) > 1) continue;         // evanescent / off-range
            const theta = Math.asin(sinTheta);
            // screen x position relative to center
            const x = Math.round(this.cvs.width/2 + Math.tan(theta) * this.distanceToScreen / this.xpx2m);
            if (x >= 0 && x < this.cvs.width) {
                const val = spec[k];
                // accumulate (multiple bins can map to same pixel; keep max or sum — we sum)
                screenIntensity[x] += val;
            }
        }

        // normalize resulting screen intensity
        let max = 0;
        for (let i = 0; i < screenIntensity.length; i++) if (screenIntensity[i] > max) max = screenIntensity[i];
        if (max > 0) {
            for (let i = 0; i < screenIntensity.length; i++) screenIntensity[i] /= max;
        }
        return screenIntensity;
    }

    // main update loop called from sim6.js
    update = () => {
        this.t += this.dt;

        if (this.redraw) {
            this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);
            // draw screen preview (top)
            this.drawScreenPreview();

            // draw grating line
            this.grating.draw(this.xpx2m);

            // compute FFT & map to screen
            const spec = this.computeFFTIntensity();
            this.screenIntensity = this.fftToScreen(spec);

            // plot intensity curve above the screen
            this.drawIntensityPlot(spec);

            // draw bottom screen slice (the intensity)
            this.drawScreenSlice(this.screenIntensity);

            this.redraw = false;
        }

        // draw intensity field (coarse sampling) below grating for visual effect
        this.renderFieldFromScreenIntensity();

    };

    // draws top small preview (mini screen view) using evaluate from spectrum
    drawScreenPreview() {
        // small black bar already in HTML canvas 'screen-view' — simulation-level preview handled in sim6.js via drawScreenView
        // Here we keep main canvas debug line above screen
    }

    drawIntensityPlot(spec) {
        const ctx = this.c;
        const topY = this.screen.y - 5;
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = i2h(this.color);

        // map N spec bins to canvas width
        const N = spec.length;
        for (let x = 0; x < this.cvs.width; x++) {
            const idx = Math.floor(x / this.cvs.width * N);
            const v = spec[idx] || 0;
            const y = topY - v * (this.cvs.height * 0.18);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // white envelope (optional) - skip, envelope not computed separately here
    }

    drawScreenSlice(screenIntensity) {
        const ctx = this.c;
        // draw white baseline for screen location
        const baseY = this.gratingY + 10;
        ctx.save();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        ctx.lineTo(this.cvs.width, baseY);
        ctx.stroke();
        ctx.restore();

        // draw intensity beneath baseline as vertical green dots / rectangles
        for (let x = 0; x < this.cvs.width; x++) {
            const v = screenIntensity[x] || 0;
            const h = Math.round(v * (this.cvs.height * 0.4));
            if (h <= 0) continue;
            // draw stacked small rectangles for dotty look
            for (let y = 0; y < h; y += 4) {
                const alpha = Math.min(1, (y / h) + 0.1);
                this.c.globalAlpha = alpha * 0.9;
                this.c.fillStyle = this.color;
                this.c.fillRect(x, baseY + 2 + y, 1, 2);
            }
            this.c.globalAlpha = 1;
        }
    }

    renderFieldFromScreenIntensity() {
        if (!this.screenIntensity) return;
        // coarse fill for visual field similar to original, but use screenIntensity
        const ctx = this.c;
        const top = this.screen.y + 10;
        for (let x = 0; x <= this.cvs.width; x += 4) {
            const v = this.screenIntensity[x] || 0;
            for (let y = top; y <= this.gratingY - 10; y += 6) {
                ctx.globalAlpha = v * 0.9;
                ctx.fillStyle = this.color;
                ctx.fillRect(x, y, 3, 3);
            }
        }
        ctx.globalAlpha = 1;
    }

    // drawScreenView: called by sim6.js to render small preview canvas (screen-view)
    drawScreenView = (screenCtx, width, height) => {
        if (!this.screenIntensity) {
            // compute on demand (cheap)
            const spec = this.computeFFTIntensity();
            this.screenIntensity = this.fftToScreen(spec);
        }

        screenCtx.clearRect(0, 0, width, height);
        for (let x = 0; x < width; x++) {
            const idx = Math.floor(x / width * this.cvs.width);
            const v = this.screenIntensity[idx] || 0;
            const color = interpolate(0, this.color, v);
            screenCtx.fillStyle = color;
            screenCtx.fillRect(x, 0, 1, height);
        }
    }

    // UI setters
    setDensity = (density) => {
        this.density = Number(density);
        this.grating.density = this.density;
        this.aperture = this.grating.buildAperture(this.fftSize, this.xpx2m);
        this.redraw = true;
    }

    setWavelength = (wavelengthNm) => {
        this.wavelength = Number(wavelengthNm) / 1e9;
        this.color = w2h(this.wavelength);
        this.redraw = true;
    }

    setDistance = (distanceMeters) => {
        this.distanceToScreen = distanceMeters;
        this.redraw = true;
    }
}

export { GratingSimulation };
