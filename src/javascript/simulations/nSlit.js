// simulations/nSlit.js
// Grating FFT-based Fraunhofer simulation (Option A visual style + colored fringes).
// Exports: GratingFFTSimulation

import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

/* Tunables */
const DEFAULT_FFT_SIZE = 16384; // reduce to 8192 if performance issues
const BLUR_SIGMA_PX = 2.5;      // smooth peaks for visibility
const ENVELOPE_BLUR = 12.0;     // smoothing when drawing white curve
const XPX2M = 0.25e-6;          // px -> m (kept tight so fringes land on-screen)
const VISUAL_GAIN = 10.0;       // small visual angle exaggeration (keeps peaks visible)
const SCREEN_LINE_Y_OFFSET = 6; // baseline offset below slits

class GratingFFTSimulation {
  constructor(cvs, c, density = 600, wavelength = 500e-9, slitWidth = 2e-6, distanceToScreen = 2.0) {
    this.cvs = cvs;
    this.c = c;

    // physical params
    this.density = Number(density);         // slits per mm
    this.wavelength = Number(wavelength);   // meters
    this.physicalSlitWidth = Number(slitWidth);
    this.distanceToScreen = Math.max(1.0, Math.min(2.0, Number(distanceToScreen)));

    // visuals
    this.visualSlitFactor = 2.2;
    this.beamFraction = 0.5; // half canvas illuminated
    this.fftSize = DEFAULT_FFT_SIZE;

    // state
    this.fftRe = null;
    this.fftIm = null;
    this.aperture = null;
    this.screenIntensity = null; // processed per-pixel intensity (0..1)
    this.color = w2h(this.wavelength); // hex color (string)
    this.redraw = true;

    // animation/time
    this.t = 0;
    this.dt = 1 / 60;

    this.resize();
  }

  get xpx2m() {
    return XPX2M;
  }

  resize() {
    // preview region
    this.screen = {
      x: Math.round(this.cvs.width / 2),
      y: Math.round(0.25 * this.cvs.height),
      w: Math.round(this.cvs.width * 0.95)
    };

    this.gratingY = Math.round(this.cvs.height * 0.9);
    this.gratingX = Math.round(this.cvs.width / 2);
    this.illuminatedWidthPx = Math.round(this.cvs.width * this.beamFraction);

    // two Grating objects: aperture (physical), visual (bigger gaps)
    this.gratingAperture = new Grating(
      this.cvs, this.c,
      this.gratingX, this.gratingY,
      this.illuminatedWidthPx, this.density, this.physicalSlitWidth
    );

    const visualSlitWidth = Math.max(this.physicalSlitWidth, this.physicalSlitWidth * this.visualSlitFactor);
    this.gratingVisual = new Grating(
      this.cvs, this.c,
      this.gratingX, this.gratingY,
      this.illuminatedWidthPx, this.density, visualSlitWidth
    );

    // allocate FFT buffers and build aperture
    this.fftRe = new Float32Array(this.fftSize);
    this.fftIm = new Float32Array(this.fftSize);
    this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);

    this.screenIntensity = null;
    this.redraw = true;
  }

  /* -------------------------
     In-place radix-2 FFT (Cooley-Tukey)
     ------------------------- */
  fftComplex(real, imag) {
    const n = real.length;
    // bit-reverse
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let tr = real[i]; real[i] = real[j]; real[j] = tr;
        let ti = imag[i]; imag[i] = imag[j]; imag[j] = ti;
      }
    }
    // Cooley-Tukey
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

  /* -------------------------
     Compute power spectrum and normalize (returns Float32Array length N)
     ------------------------- */
  computeSpec() {
    this.fftRe.set(this.aperture);
    this.fftIm.fill(0);

    this.fftComplex(this.fftRe, this.fftIm);

    const N = this.fftSize;
    const spec = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const mag = this.fftRe[i] * this.fftRe[i] + this.fftIm[i] * this.fftIm[i];
      const j = (i + N / 2) & (N - 1); // shift
      spec[j] = mag;
    }
    // normalize
    let max = 0;
    for (let i = 0; i < N; i++) if (spec[i] > max) max = spec[i];
    if (max > 0) for (let i = 0; i < N; i++) spec[i] /= max;
    return spec;
  }

  /* -------------------------
     Map spectrum bins -> screen pixels using sin(theta) mapping and D
     Returns Float32Array of length cvs.width (normalized)
     ------------------------- */
  fftToScreen(spec) {
    const N = spec.length;
    const apertureMeters = this.illuminatedWidthPx * this.xpx2m;
    const screen = new Float32Array(this.cvs.width);
    screen.fill(0);

    for (let k = 0; k < N; k++) {
      const fx = (k - N / 2) / apertureMeters; // cycles per meter
      const sinTheta = fx * this.wavelength;
      if (Math.abs(sinTheta) > 1) continue;
      let theta = Math.asin(sinTheta);

      // slight visual exaggeration to keep orders visible
      theta *= VISUAL_GAIN;

      const physicalX = Math.tan(theta) * this.distanceToScreen;
      const px = Math.round(this.cvs.width / 2 + physicalX / this.xpx2m);
      if (px >= 0 && px < this.cvs.width) screen[px] += spec[k];
    }

    // normalize
    let max = 0;
    for (let i = 0; i < screen.length; i++) if (screen[i] > max) max = screen[i];
    if (max > 0) for (let i = 0; i < screen.length; i++) screen[i] /= max;
    return screen;
  }

  /* -------------------------
     Simple 1D Gaussian blur (returns new Float32Array)
     ------------------------- */
  blur1D(array, sigmaPx = BLUR_SIGMA_PX) {
    const radius = Math.ceil(sigmaPx * 3);
    const size = radius * 2 + 1;
    const kernel = new Float32Array(size);
    let sum = 0;
    for (let i = -radius; i <= radius; i++) {
      const v = Math.exp(-0.5 * (i * i) / (sigmaPx * sigmaPx));
      kernel[i + radius] = v;
      sum += v;
    }
    for (let i = 0; i < size; i++) kernel[i] /= sum;

    const N = array.length;
    const out = new Float32Array(N);
    for (let x = 0; x < N; x++) {
      let val = 0;
      for (let k = -radius; k <= radius; k++) {
        const ix = x + k;
        if (ix < 0 || ix >= N) continue;
        val += array[ix] * kernel[k + radius];
      }
      out[x] = val;
    }
    return out;
  }

  /* -------------------------
     Compute processed screen intensity and a smoothed envelope for plotting.
     intensity returned is normalized 0..1 with the max peak set to 1 (mode 1).
     ------------------------- */
  computeProcessedIntensity() {
    // build aperture & spec
    this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);
    const spec = this.computeSpec();

    // map to screen pixels
    let screen = this.fftToScreen(spec);

    // widen narrow spikes so secondary maxima visible
    screen = this.blur1D(screen, BLUR_SIGMA_PX);

    // final normalize so highest peak hits 1 (scaling mode 1)
    let max = 0;
    for (let v of screen) if (v > max) max = v;
    if (max > 0) {
      for (let i = 0; i < screen.length; i++) screen[i] /= max;
    }

    // store processed intensity and return spec + intensity
    this.screenIntensity = screen;
    return { spec, screen };
  }

  /* -------------------------
     Draw the white intensity curve (smoothed) above slits.
     We smooth the computed 'spec' (low-pass) and draw white curve.
     ------------------------- */
  drawWhiteIntensityCurve(spec) {
    const ctx = this.c;
    // downsample spec to canvas width by block averaging
    const N = spec.length;
    const out = new Float32Array(this.cvs.width);
    const block = Math.max(1, Math.floor(N / this.cvs.width));
    for (let x = 0; x < this.cvs.width; x++) {
      let sum = 0, count = 0;
      const start = x * block;
      const end = Math.min(N, start + block);
      for (let k = start; k < end; k++) {
        sum += spec[k];
        count++;
      }
      out[x] = count ? sum / count : 0;
    }

    // smooth heavily (envelope-like) to get a clean white curve
    const smooth = this.blur1D(out, ENVELOPE_BLUR);

    // normalize smooth so top of curve sits nicely above screen.y
    let max = 0;
    for (let v of smooth) if (v > max) max = v;
    const scale = max > 0 ? 1 / max : 1;

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = "#FFFFFF";
    for (let x = 0; x < this.cvs.width; x++) {
      const v = smooth[x] * scale;
      const y = (this.screen.y - 5) - v * (this.cvs.height * 0.22); // push curve up a bit
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* -------------------------
     Draw colored screen slice (pixels) below slits.
     ------------------------- */
  drawScreenSlice(screenIntensity) {
    const ctx = this.c;
    const baseY = this.gratingY + SCREEN_LINE_Y_OFFSET; // baseline (white line will be drawn separately)
    // draw white baseline just above colored pixels (but below slits)
    ctx.save();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, baseY - 4); // a little above colored pixels
    ctx.lineTo(this.cvs.width, baseY - 4);
    ctx.stroke();
    ctx.restore();

    // draw colored intensity pixels below baseline
    for (let x = 0; x < this.cvs.width; x++) {
      const v = screenIntensity[x] || 0;
      const h = Math.round(v * (this.cvs.height * 0.45));
      if (h <= 0) continue;
      for (let y = 0; y < h; y += 3) {
        const alpha = Math.min(1, 0.25 + 0.75 * (y / h));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color; // hex from w2h()
        ctx.fillRect(x, baseY + 2 + y, 2, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* -------------------------
     Aesthetic Fraunhofer fan (between grating and screen)
     ------------------------- */
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

  /* -------------------------
     drawScreenView preview (called from sim6.js)
     draws colored preview and a white screen line at top
     ------------------------- */
  drawScreenView = (screenCtx, width, height) => {
    if (!this.screenIntensity) {
      const { spec, screen } = this.computeProcessedIntensity();
      this.screenIntensity = screen;
    }
    screenCtx.clearRect(0, 0, width, height);
    for (let x = 0; x < width; x++) {
      const idx = Math.floor((x / width) * this.cvs.width);
      const v = this.screenIntensity[idx] || 0;
      screenCtx.fillStyle = interpolate(0, this.color, v);
      screenCtx.fillRect(x, 0, 1, height);
    }

    // single white line at top of preview
    screenCtx.strokeStyle = "#FFFFFF";
    screenCtx.lineWidth = 2;
    screenCtx.beginPath();
    screenCtx.moveTo(0, 2);
    screenCtx.lineTo(width, 2);
    screenCtx.stroke();
  };

  /* -------------------------
     Main update loop
     ------------------------- */
  update = () => {
    this.t += this.dt;

    if (this.redraw) {
      // clear canvas
      this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);

      // draw visual slit line (unchanged)
      this.gratingVisual.draw(this.xpx2m);

      // compute intensity (aperture->spec->screenIntensity)
      const { spec, screen } = this.computeProcessedIntensity();

      // store
      this.screenIntensity = screen;

      // draw white intensity curve on top
      this.drawWhiteIntensityCurve(spec);

      // draw colored screen slice beneath slits
      this.drawScreenSlice(screen);

      this.redraw = false;
    } else {
      // partial clear region between screen and slits for anim efficiency
      this.c.clearRect(0, this.screen.y + 2.5, this.cvs.width, this.gratingY - this.screen.y - 5);
    }

    // always render wave fan for aesthetic
    this.renderWaveFan();
  };

  /* -------------------------
     UI setters (match your sim6.js)
     ------------------------- */
  setDensity = (density) => {
    this.density = Number(density);
    this.gratingAperture.density = this.density;
    this.gratingVisual.density = this.density;
    // rebuild aperture on next redraw
    this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);
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
