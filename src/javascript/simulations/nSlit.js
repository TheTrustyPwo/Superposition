// FFT Fraunhofer grating simulation using the project's Grating (named export).

import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

/*
  Fringe spacing traditionally is:
      Δx ≈ D λ / d

  For d ≈ 1–2 µm (as in 600 slits/mm), fringe spacing is tiny.
  To make the simulation *visible*, this version applies a tunable
  visualization scale to the angular spread.

  Change VISUAL_ANGLE_GAIN below to exaggerate spacing.
*/

const VISUAL_ANGLE_GAIN = 15.0;   // ★★★ exaggerate diffraction angle

class GratingFFTSimulation {
  constructor(cvs, ctx, density = 600, wavelength = 500e-9, slitWidth = 2e-6, distanceToScreen = 2.0) {
    this.cvs = cvs;
    this.c = ctx;

    // physics params
    this.density = Number(density);        
    this.wavelength = Number(wavelength);  
    this.physicalSlitWidth = Number(slitWidth);
    this.distanceToScreen = Math.max(1.0, Math.min(2.0, Number(distanceToScreen)));

    // visual params
    this.visualSlitFactor = 2.2;
    this.beamFraction = 0.5;

    // FFT params
    this.fftSize = 16384;
    this.fftRe = null;
    this.fftIm = null;

    this.t = 0;
    this.dt = 1 / 60;

    this.color = w2h(this.wavelength);
    this.redraw = true;
    this.screenIntensity = null;

    this.resize();
  }

  // px → m
  get xpx2m() {
    return 2e-6;  // 2 µm per pixel
  }

  /* ----------------------------------
     Resize / rebuild aperture
  ------------------------------------- */
  resize() {
    this.screen = {
      x: Math.round(this.cvs.width / 2),
      y: Math.round(0.25 * this.cvs.height),
      w: Math.round(this.cvs.width * 0.95)
    };

    // grating position
    this.gratingY = Math.round(this.cvs.height * 0.9);
    this.gratingX = Math.round(this.cvs.width / 2);

    // illuminated width = half canvas
    this.illuminatedWidthPx = Math.round(this.cvs.width * this.beamFraction);

    // two gratings:
    // A: physical slit width for FFT
    // B: slightly larger for visual gaps
    this.gratingAperture = new Grating(
      this.cvs,
      this.c,
      this.gratingX,
      this.gratingY,
      this.illuminatedWidthPx,
      this.density,
      this.physicalSlitWidth
    );

    const visualSlitW = Math.max(this.physicalSlitWidth, this.physicalSlitWidth * this.visualSlitFactor);
    this.gratingVisual = new Grating(
      this.cvs,
      this.c,
      this.gratingX,
      this.gratingY,
      this.illuminatedWidthPx,
      this.density,
      visualSlitW
    );

    this.fftRe = new Float32Array(this.fftSize);
    this.fftIm = new Float32Array(this.fftSize);
    this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);

    this.redraw = true;
    this.screenIntensity = null;
  }

  /* ----------------------------------
     FFT (radix-2)
  ------------------------------------- */
  fftComplex(real, imag) {
    const n = real.length;

    // bit reversal
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }

    // butterflies
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = 0; j < half; j++) {
          const k = j * step;
          const angle = -2 * Math.PI * k / n;
          const wr = Math.cos(angle), wi = Math.sin(angle);
          const i1 = i + j;
          const i2 = i1 + half;

          const xr = wr * real[i2] - wi * imag[i2];
          const xi = wr * imag[i2] + wi * real[i2];

          real[i2] = real[i1] - xr;
          imag[i2] = imag[i1] - xi;
          real[i1] += xr;
          imag[i1] += xi;
        }
      }
    }
  }

  /* ----------------------------------
     Spectrum computation
  ------------------------------------- */
  computeSpec() {
    this.fftRe.set(this.aperture);
    this.fftIm.fill(0);

    this.fftComplex(this.fftRe, this.fftIm);

    const N = this.fftSize;
    const spec = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const m = this.fftRe[i] * this.fftRe[i] + this.fftIm[i] * this.fftIm[i];
      const j = (i + N/2) & (N - 1);
      spec[j] = m;
    }

    let max = 0;
    for (let v of spec) if (v > max) max = v;

    if (max > 0) for (let i = 0; i < N; i++) spec[i] /= max;

    return spec;
  }

  /* ----------------------------------
     Map FFT → screen pixels with ANGLE GAIN
  ------------------------------------- */
  fftToScreen(spec) {
    const N = spec.length;
    const apertureMeters = this.illuminatedWidthPx * this.xpx2m;

    const screen = new Float32Array(this.cvs.width);
    screen.fill(0);

    for (let k = 0; k < N; k++) {
      const fx = (k - N/2) / apertureMeters;
      const sinTheta = fx * this.wavelength;
      if (Math.abs(sinTheta) > 1) continue;

      let theta = Math.asin(sinTheta);

      // ★★★ exaggerate visually
      theta *= VISUAL_ANGLE_GAIN;

      const x = Math.round(
        this.cvs.width/2 +
        Math.tan(theta) * this.distanceToScreen / this.xpx2m
      );

      if (x >= 0 && x < this.cvs.width) screen[x] += spec[k];
    }

    let max = 0;
    for (let v of screen) if (v > max) max = v;
    if (max > 0) for (let i = 0; i < screen.length; i++) screen[i] /= max;

    return screen;
  }

  /* ----------------------------------
     FRAME UPDATE
  ------------------------------------- */
  update = () => {
    this.t += this.dt;

    if (this.redraw) {
      this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);

      // Draw grating
      this.gratingVisual.draw(this.xpx2m);

      // Compute diffraction pattern
      this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);
      const spec = this.computeSpec();
      this.screenIntensity = this.fftToScreen(spec);

      this.drawIntensityPlot(spec);
      this.drawScreenSlice(this.screenIntensity);

      this.redraw = false;
    }

    // Draw Fraunhofer fan
    this.renderWaveFan();
  };

  /* ----------------------------------
     INTENSITY PLOT (top)
  ------------------------------------- */
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
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  /* ----------------------------------
     SCREEN SLICE (bottom)
  ------------------------------------- */
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
      const v = screenIntensity[x];
      const h = Math.round(v * this.cvs.height * 0.45);
      if (h <= 0) continue;

      for (let y = 0; y < h; y += 3) {
        const alpha = Math.min(1, 0.3 + 0.7 * (y / h));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, baseY + 2 + y, 1, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ----------------------------------
     FRAUNHOFER WAVE FAN (middle)
  ------------------------------------- */
  renderWaveFan() {
    if (!this.screenIntensity) return;

    const ctx = this.c;
    const top = this.screen.y + 10;
    const bottom = this.gratingY - 10;
    const height = bottom - top;

    const slices = 32;
    for (let s = 0; s < slices; s++) {
      const frac = s / (slices - 1);
      const y = Math.round(top + frac * height);

      const att = 1 - 0.8 * frac;
      for (let x = 0; x < this.cvs.width; x += 3) {
        const v = this.screenIntensity[x] || 0;
        if (v < 0.01) continue;

        ctx.globalAlpha = v * att * 0.8;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    ctx.globalAlpha = 1;
  }

  /* ----------------------------------
     PREVIEW CANVAS
  ------------------------------------- */
  drawScreenView = (screenCtx, width, height) => {
    if (!this.screenIntensity) {
      const spec = this.computeSpec();
      this.screenIntensity = this.fftToScreen(spec);
    }

    screenCtx.clearRect(0, 0, width, height);
    for (let x = 0; x < width; x++) {
      const idx = Math.floor((x / width) * this.cvs.width);
      const v = this.screenIntensity[idx] || 0;
      screenCtx.fillStyle = interpolate(0, this.color, v);
      screenCtx.fillRect(x, 0, 1, height);
    }
  };

  /* ----------------------------------
     UI SETTERS
  ------------------------------------- */
  setDensity = (density) => {
    this.density = Number(density);
    this.gratingAperture.density = this.density;
    this.gratingVisual.density = this.density;
    this.redraw = true;
  };

  setWavelength = (wavelengthNm) => {
    this.wavelength = Number(wavelengthNm) / 1e9;
    this.color = w2h(this.wavelength);
    this.redraw = true;
  };

  setDistance = (distanceMeters) => {
    this.distanceToScreen = Math.max(1.0, Math.min(2.0, Number(distanceMeters)));
    this.redraw = true;
  };
}

export { GratingFFTSimulation };
