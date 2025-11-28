// simulations/nSlit.js
// FFT Fraunhofer grating simulation using the project's Grating (named export).
// Exports: GratingFFTSimulation

import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

/*
  Notes:
  - Uses two Grating instances:
    * gratingAperture: physical slitWidth used to build aperture for FFT.
    * gratingVisual: visual slitWidth (larger) used only for drawing the slit line.
  - Pixel scale xpx2m is 2e-6 m/px (2 µm per pixel) — tuned so distance & density changes are visible.
*/

class GratingFFTSimulation {
  constructor(cvs, ctx, density = 600, wavelength = 500e-9, slitWidth = 2e-6, distanceToScreen = 2.0) {
    this.cvs = cvs;
    this.c = ctx;

    // physics params
    this.density = Number(density);        // slits per mm
    this.wavelength = Number(wavelength);  // meters
    this.physicalSlitWidth = Number(slitWidth); // meters (used for aperture)
    this.distanceToScreen = Math.max(1.0, Math.min(2.0, Number(distanceToScreen))); // meters

    // visual params
    this.visualSlitFactor = 2.2; // multiply physical slit width by this for visual gaps
    this.beamFraction = 0.5; // illuminated region is half canvas width

    // FFT params
    this.fftSize = 16384; // reduce to 8192/4096 on slow devices
    this.fftRe = null;
    this.fftIm = null;

    // time step (for any animated effects)
    this.t = 0;
    this.dt = 1 / 60;

    this.color = w2h(this.wavelength);
    this.redraw = true;
    this.screenIntensity = null;

    this.resize();
  }

  // realistic px -> m mapping (2 µm per px)
  get xpx2m() {
    return 0.25e-6;
  }

  // recompute geometry, grating helpers, aperture and arrays
  resize() {
    // small top preview region
    this.screen = {
      x: Math.round(this.cvs.width / 2),
      y: Math.round(0.25 * this.cvs.height),
      w: Math.round(this.cvs.width * 0.95)
    };

    // grating position
    this.gratingY = Math.round(this.cvs.height * 0.9);
    this.gratingX = Math.round(this.cvs.width / 2);

    // illuminated width in px (half canvas)
    this.illuminatedWidthPx = Math.round(this.cvs.width * this.beamFraction);

    // build two grating objects:
    // - gratingAperture uses the physical slit width for aperture building
    // - gratingVisual uses a slightly larger slit width so gaps remain visible at high density
    this.gratingAperture = new Grating(
      this.cvs,
      this.c,
      this.gratingX,
      this.gratingY,
      this.illuminatedWidthPx,
      this.density,
      this.physicalSlitWidth
    );

    const visualSlitWidth = Math.max(this.physicalSlitWidth, this.physicalSlitWidth * this.visualSlitFactor);
    this.gratingVisual = new Grating(
      this.cvs,
      this.c,
      this.gratingX,
      this.gratingY,
      this.illuminatedWidthPx,
      this.density,
      visualSlitWidth
    );

    // allocate FFT arrays and build aperture
    this.fftRe = new Float32Array(this.fftSize);
    this.fftIm = new Float32Array(this.fftSize);
    this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);

    this.redraw = true;
    this.screenIntensity = null;
  }

  /* -----------------------------
     In-place radix-2 FFT (Cooley-Tukey)
     ----------------------------- */
  fftComplex(real, imag) {
    const n = real.length;
    // bit-reversal
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let tr = real[i]; real[i] = real[j]; real[j] = tr;
        let ti = imag[i]; imag[i] = imag[j]; imag[j] = ti;
      }
    }

    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = 0; j < half; j++) {
          const k = j * step;
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

  // compute normalized power spectrum (magnitude squared) and center-shift
  computeSpec() {
    this.fftRe.set(this.aperture);
    this.fftIm.fill(0);

    this.fftComplex(this.fftRe, this.fftIm);

    const N = this.fftSize;
    const spec = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const mag = this.fftRe[i] * this.fftRe[i] + this.fftIm[i] * this.fftIm[i];
      // shift so DC is in the middle
      const j = (i + N/2) & (N - 1);
      spec[j] = mag;
    }
    // normalize
    let max = 0;
    for (let i = 0; i < N; i++) if (spec[i] > max) max = spec[i];
    if (max > 0) for (let i = 0; i < N; i++) spec[i] /= max;
    return spec;
  }

  // map spectrum bins to screen pixels using sin(theta) mapping and distance to screen
  fftToScreen(spec) {
    const N = spec.length;
    const apertureMeters = this.illuminatedWidthPx * this.xpx2m;
    const screenIntensity = new Float32Array(this.cvs.width);
    screenIntensity.fill(0);

    for (let k = 0; k < N; k++) {
      const fx = (k - N/2) / apertureMeters;      // cycles per meter
      const sinTheta = fx * this.wavelength;      // sinθ = λ · fx
      if (Math.abs(sinTheta) > 1) continue;
      const theta = Math.asin(sinTheta);
      // map to pixel x: tan(theta) * D / (m per px)
      const x = Math.round(this.cvs.width/2 + Math.tan(theta) * this.distanceToScreen / this.xpx2m);
      if (x >= 0 && x < this.cvs.width) screenIntensity[x] += spec[k];
    }

    // normalize screen intensity
    let max = 0;
    for (let i = 0; i < screenIntensity.length; i++) if (screenIntensity[i] > max) max = screenIntensity[i];
    if (max > 0) for (let i = 0; i < screenIntensity.length; i++) screenIntensity[i] /= max;
    return screenIntensity;
  }

  /* -----------------------------
     Main update / draw
     ----------------------------- */
  update = () => {
    this.t += this.dt;

    if (this.redraw) {
      // clear canvas
      this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);

      // draw visual slit line (uses larger visual slit width so gaps remain visible)
      this.gratingVisual.draw(this.xpx2m);

      // rebuild aperture and compute spectrum
      this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);
      const spec = this.computeSpec();
      this.screenIntensity = this.fftToScreen(spec);

      // top intensity plot
      this.drawIntensityPlot(spec);

      // bottom screen slice
      this.drawScreenSlice(this.screenIntensity);

      this.redraw = false;
    }

    // draw aesthetic Fraunhofer "fan" between grating and screen (fast)
    this.renderWaveFan();
  };

  drawIntensityPlot(spec) {
    const ctx = this.c;
    const topY = this.screen.y - 5;
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = i2h(this.color);
    const N = spec.length;
    for (let x = 0; x < this.cvs.width; x++) {
      const idx = Math.floor((x / this.cvs.width) * N);
      const v = spec[idx] || 0;
      const y = topY - v * (this.cvs.height * 0.18);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

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

  // simple Fraunhofer fan for middle region (aesthetic)
  renderWaveFan() {
    if (!this.screenIntensity) return;
    const ctx = this.c;
    const top = this.screen.y + 10;
    const bottom = this.gratingY - 10;
    const height = bottom - top;
    if (height <= 0) return;

    const slices = 28;
    for (let s = 0; s < slices; s++) {
      const frac = s / (slices - 1);
      const y = Math.round(top + frac * height);
      const att = 1 - 0.9 * frac;
      for (let x = 0; x < this.cvs.width; x += 4) {
        const v = this.screenIntensity[x] || 0;
        if (v < 0.01) continue;
        ctx.globalAlpha = v * att * 0.9;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, 3, 3);
      }
    }
    ctx.globalAlpha = 1;
  }

  // preview canvas (screen-view) — called from sim6.js
  drawScreenView = (screenCtx, width, height) => {
    if (!this.screenIntensity) {
      const spec = this.computeSpec();
      this.screenIntensity = this.fftToScreen(spec);
    }
    screenCtx.clearRect(0, 0, width, height);
    for (let x = 0; x < width; x++) {
      const idx = Math.floor((x / width) * this.cvs.width);
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
    // update both gratings
    this.gratingAperture.density = this.density;
    this.gratingVisual.density = this.density;
    // rebuild aperture
    this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);
    this.redraw = true;
  };

  setWavelength = (wavelengthNm) => {
    this.wavelength = Number(wavelengthNm) / 1e9;
    this.color = w2h(this.wavelength);
    this.redraw = true;
  };

  setDistance = (distanceMeters) => {
    const d = Math.max(1.0, Math.min(2.0, Number(distanceMeters)));
    this.distanceToScreen = d;
    this.redraw = true;
  };
}

export { GratingFFTSimulation };
