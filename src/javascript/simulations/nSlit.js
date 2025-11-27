import { Simulation } from "./index.js";
import { HorizontalScreen } from "../shared/screen.js";
import { i2h, interpolate, w2h } from "../utils/color.js";
import { distance } from "../utils/math.js";
import { Grating } from "../shared/slit.js";

class GratingSimulation {

    constructor(cvs, ctx, centerX, centerY, illuminatedWidthPx, densityPerMm, slitWidthMeters = 2e-6) {
        this.cvs = cvs;
        this.c = ctx;
        this.x = centerX;
        this.y = centerY;
        this.w = illuminatedWidthPx;
        this.density = densityPerMm;
        this.slitWidth = slitWidthMeters;
        this.MAX_DRAWN_SLITS = 600; // cap drawn slits for performance
    }

    // center-to-center spacing in meters
    get spacingMeters() {
        return 1 / (this.density * 1e3);
    }

    // compute theoretical total slits across illuminated width given xpx2m mapping
    totalSlits(xpx2m) {
        const widthMeters = (this.w) * xpx2m;
        return Math.max(1, Math.floor(widthMeters / this.spacingMeters));
    }

    // draw substrate + symbolic slits (ticks or small erased gaps)
    draw(xpx2m) {
        this.xpx2m = xpx2m;
        const ctx = this.c;
        const half = this.w / 2;
        const left = this.x - half;
        const right = this.x + half;

        // substrate (half-thickness as requested)
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = SLITS.COLOR;
        ctx.lineWidth = SLITS.WIDTH / 2;
        ctx.moveTo(left, this.y);
        ctx.lineTo(right, this.y);
        ctx.stroke();
        ctx.restore();

        // compute spacing in px and total slits
        const spacingPx = this.spacingMeters / xpx2m;
        const total = this.totalSlits(xpx2m);
        const step = Math.max(1, Math.floor(total / this.MAX_DRAWN_SLITS));
        const centerIndex = Math.floor(total / 2);
        const tickLen = 8;

        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = SLITS.COLOR;

        for (let i = 0; i < total; i += step) {
            const offset = i - centerIndex;
            const px = this.x + offset * spacingPx;
            if (px < left - 2 || px > right + 2) continue;

            if (spacingPx >= 6) {
                // small erased gap to look like real slit
                ctx.save();
                ctx.globalCompositeOperation = "destination-out";
                const gapW = Math.max(2, Math.round((this.slitWidth / xpx2m) * 0.6));
                ctx.fillStyle = "rgba(0,0,0,1)";
                ctx.fillRect(px - gapW / 2, this.y - SLITS.WIDTH * 1.5, gapW, SLITS.WIDTH * 3);
                ctx.restore();
            } else {
                // tick mark
                ctx.moveTo(px, this.y - tickLen);
                ctx.lineTo(px, this.y + tickLen);
            }
        }

        ctx.stroke();
    }

    // Build sampled aperture array (Float32Array) with given FFT size and xpx2m mapping.
    // Aperture: samples normalized to 0/1 (opaque=0, open=1)
    buildAperture(fftSize, xpx2m) {
        const N = fftSize;
        const aperture = new Float32Array(N);
        aperture.fill(0);

        const apertureWidthMeters = this.w * xpx2m;
        const dx = apertureWidthMeters / N;
        const total = this.totalSlits(xpx2m);
        const centerIndex = Math.floor(total / 2);
        const spacing = this.spacingMeters;
        const slitHalf = this.slitWidth / 2;

        // left edge of aperture in meters (centered at 0)
        const leftEdge = -apertureWidthMeters / 2;

        // For each slit (theoretical), mark samples in aperture array
        for (let i = 0; i < total; i++) {
            const offset = (i - centerIndex) * spacing;
            const slitCenter = offset; // meters relative to aperture center
            const startMeters = slitCenter - slitHalf;
            const endMeters = slitCenter + slitHalf;

            // convert to sample indices
            const s = Math.floor((startMeters - leftEdge) / dx);
            const e = Math.ceil((endMeters - leftEdge) / dx);
            const si = Math.max(0, s);
            const ei = Math.min(N - 1, e);
            for (let k = si; k <= ei; k++) aperture[k] = 1.0;
        }

        return aperture;
    }
}

/* -----------------------------
   GratingFFTSimulation
   ----------------------------- */
class GratingFFTSimulation extends GratingSimulation {
    constructor(cvs, c, density = 600, wavelength = 500e-9, slitWidth = 2e-6, distanceToScreen = 2.0) {
        super(cvs, c);
        this.cvs = cvs;
        this.c = c;

        this.density = density;          // lines per mm
        this.wavelength = wavelength;    // meters
        this.slitWidth = slitWidth;      // meters
        this.distanceToScreen = distanceToScreen; // meters (will respect 1.0 - 2.0 m via UI)

        this.beamFraction = 0.5; // beam width fixed to half canvas width

        // FFT parameters
        this.fftSize = 16384; // high resolution for narrow peaks (reduce if slow)
        this.fftRe = null;
        this.fftIm = null;

        this.t = 0;
        this.dt = 1 / 60;

        this.color = w2h(this.wavelength);

        this.redraw = true;
        this.screenIntensity = null;

        this.resize();
    }

    // px -> m scale
    get xpx2m() {
        // keep similar mapping as earlier code. Tweak if absolute sizes look off.
        return 5e-5; // 0.00005 m per pixel (50 microns per px)
    }

    resize = () => {
        super.resize();

        // top mini-screen preview region
        this.screen = {
            x: this.cvs.width / 2,
            y: Math.round(0.25 * this.cvs.height),
            w: Math.round(this.cvs.width * 0.95)
        };

        // grating location
        this.gratingY = Math.round(this.cvs.height * 0.9);
        this.gratingX = Math.round(this.cvs.width / 2);

        // illuminated width (fixed to half canvas width)
        this.illuminatedWidthPx = Math.round(this.cvs.width * this.beamFraction);

        // setup grating helper
        this.grating = new GratingSimulation(this.cvs, this.c, this.gratingX, this.gratingY, this.illuminatedWidthPx, this.density, this.slitWidth);

        // allocate FFT arrays and build aperture
        this.fftRe = new Float32Array(this.fftSize);
        this.fftIm = new Float32Array(this.fftSize);
        this.aperture = this.grating.buildAperture(this.fftSize, this.xpx2m);

        // precompute spectrum (heavy) lazily on redraw
        this.redraw = true;
    }

    /* -----------------------------
       Radix-2 Cooley-Tukey FFT (in-place)
       ----------------------------- */
    fftComplex(real, imag) {
        const n = real.length;
        const levels = Math.log2(n);
        if (Math.floor(levels) !== levels) throw new Error("FFT size must be power of 2");

        // bit-reverse permutation
        for (let i = 0, j = 0; i < n; i++) {
            if (j > i) {
                let tr = real[i], ti = imag[i];
                real[i] = real[j]; imag[i] = imag[j];
                real[j] = tr; imag[j] = ti;
            }
            let bit = n >>> 1;
            for (; j & bit; bit >>>= 1) j ^= bit;
            j ^= bit;
        }

        // Cooley-Tukey
        for (let size = 2; size <= n; size <<= 1) {
            const half = size >>> 1;
            const tableStep = n / size;
            for (let i = 0; i < n; i += size) {
                for (let j = 0; j < half; j++) {
                    const k = j * tableStep;
                    const angle = -2 * Math.PI * k / n;
                    const wr = Math.cos(angle), wi = Math.sin(angle);
                    const off = i + j, off2 = off + half;

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

    // compute normalized power spectrum from aperture (rebuilds aperture if needed)
    computeSpec() {
        // copy aperture into re[], zero imag
        this.fftRe.set(this.aperture);
        this.fftIm.fill(0);

        // perform FFT
        this.fftComplex(this.fftRe, this.fftIm);

        const N = this.fftSize;
        const spec = new Float32Array(N);
        // compute magnitudes and shift (center DC in middle)
        for (let i = 0; i < N; i++) {
            const mag = this.fftRe[i] * this.fftRe[i] + this.fftIm[i] * this.fftIm[i];
            const j = (i + N / 2) & (N - 1);
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

    // map FFT bins to screen x using sin(theta) mapping and distanceToScreen
    fftToScreen(spec) {
        const N = spec.length;
        const apertureMeters = this.illuminatedWidthPx * this.xpx2m;
        const apertureWidthMeters = apertureMeters;

        // initialize screen intensity
        const screenIntensity = new Float32Array(this.cvs.width);
        screenIntensity.fill(0);

        for (let k = 0; k < N; k++) {
            const fx = (k - N / 2) / apertureWidthMeters;  // cycles per meter
            const sinTheta = fx * this.wavelength;        // sinθ = λ * fx
            if (Math.abs(sinTheta) > 1) continue;
            const theta = Math.asin(sinTheta);
            // convert to screen x (tan(theta) * D mapped to pixels)
            const x = Math.round(this.cvs.width / 2 + Math.tan(theta) * this.distanceToScreen / this.xpx2m);
            if (x >= 0 && x < this.cvs.width) {
                screenIntensity[x] += spec[k];
            }
        }

        // normalize screen intensity (so 0..1)
        let max = 0;
        for (let i = 0; i < screenIntensity.length; i++) if (screenIntensity[i] > max) max = screenIntensity[i];
        if (max > 0) {
            for (let i = 0; i < screenIntensity.length; i++) screenIntensity[i] /= max;
        }
        return screenIntensity;
    }

    /* -----------------------------
       Main update/render
       ----------------------------- */
    update = () => {
        this.t += this.dt;

        if (this.redraw) {
            // clear whole canvas
            this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);

            // draw small screen preview later via drawScreenView (sim6.js)
            // draw grating line
            this.grating.draw(this.xpx2m);

            // build aperture each redraw (ensures density/width changes reflect immediately)
            this.aperture = this.grating.buildAperture(this.fftSize, this.xpx2m);

            // compute spectrum and screen intensity
            const spec = this.computeSpec();
            this.screenIntensity = this.fftToScreen(spec);

            // draw intensity curve (above screen)
            this.drawIntensityPlot(spec);

            // draw bottom screen slice (intensity)
            this.drawScreenSlice(this.screenIntensity);

            this.redraw = false;
        }

        // always render a "wave fan" between grating and screen using the screenIntensity
        this.renderWaveFan();
    };

    // draw intensity plot (top)
    drawIntensityPlot(spec) {
        const ctx = this.c;
        const topY = this.screen.y - 5;
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = i2h(this.color);

        const N = spec.length;
        for (let x = 0; x < this.cvs.width; x++) {
            const idx = Math.floor(x / this.cvs.width * N);
            const v = spec[idx] || 0;
            const y = topY - v * (this.cvs.height * 0.18);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // draw bottom screen slice of intensity
    drawScreenSlice(screenIntensity) {
        const ctx = this.c;
        const baseY = this.gratingY + 10;
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        ctx.lineTo(this.cvs.width, baseY);
        ctx.stroke();
        ctx.restore();

        // draw intensity as stacked pixels/dots beneath baseline
        for (let x = 0; x < this.cvs.width; x++) {
            const v = screenIntensity[x] || 0;
            const h = Math.round(v * (this.cvs.height * 0.45));
            if (h <= 0) continue;
            for (let y = 0; y < h; y += 3) {
                const alpha = Math.min(1, 0.3 + 0.7 * (y / h));
                this.c.globalAlpha = alpha;
                this.c.fillStyle = this.color;
                this.c.fillRect(x, baseY + 2 + y, 1, 2);
            }
        }
        this.c.globalAlpha = 1;
    }

    // render a "wave fan" between grating and screen to give the propagation visual
    renderWaveFan() {
        if (!this.screenIntensity) return;
        const ctx = this.c;

        const top = this.screen.y + 10;
        const bottom = this.gratingY - 10;
        const height = bottom - top;
        if (height <= 0) return;

        // draw multiple slices of the screen intensity scaled by distance to simulate rays
        const slices = 28; // number of intermediate rows
        for (let s = 0; s < slices; s++) {
            const frac = s / (slices - 1);
            const y = Math.round(top + frac * height);
            // attenuation with propagation distance (so nearer rows are brighter)
            const att = 1 - 0.9 * frac;

            // draw coarsely for speed
            for (let x = 0; x < this.cvs.width; x += 4) {
                const v = this.screenIntensity[x] || 0;
                if (v < 0.01) continue;
                ctx.globalAlpha = v * att * 0.9;
                ctx.fillStyle = this.color;
                // scale horizontal spread: nearer to grating -> narrower; drive from frac and distance
                const spread = 1 + Math.round((1 - frac) * 6); // coarse spread
                ctx.fillRect(x, y, 3, 3);
            }
        }
        ctx.globalAlpha = 1;
    }

    // draw mini preview on screen-view canvas (called by sim6.js)
    drawScreenView = (screenCtx, width, height) => {
        if (!this.screenIntensity) {
            const spec = this.computeSpec();
            this.screenIntensity = this.fftToScreen(spec);
        }
        screenCtx.clearRect(0, 0, width, height);
        for (let x = 0; x < width; x++) {
            // map preview x to main canvas index
            const idx = Math.floor(x / width * this.cvs.width);
            const v = this.screenIntensity[idx] || 0;
            const color = interpolate(0, this.color, v);
            screenCtx.fillStyle = color;
            screenCtx.fillRect(x, 0, 1, height);
        }
    };

    /* -----------------------------
       UI setters
       ----------------------------- */
    setDensity = (density) => {
        this.density = Number(density);
        this.grating.density = this.density;
        // rebuild aperture and recompute on next redraw
        this.aperture = this.grating.buildAperture(this.fftSize, this.xpx2m);
        this.redraw = true;
    };

    setWavelength = (wavelengthNm) => {
        this.wavelength = Number(wavelengthNm) / 1e9;
        this.color = w2h(this.wavelength);
        this.redraw = true;
    };

    setDistance = (distanceMeters) => {
        // clamp distance to [1.0, 2.0] meters (100-200 cm)
        const d = Math.max(1.0, Math.min(2.0, Number(distanceMeters)));
        this.distanceToScreen = d;
        this.redraw = true;
    };
}

export { GratingFFTSimulation };
