// FFT Fraunhofer grating simulation using the project's Grating (named export).

import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

/*
  This file includes:
   - VISUAL_ANGLE_GAIN to exaggerate angular spread (set to 12 = extreme)
   - px->m scale tightened to 0.25 µm/px (strong tightening)
   - 1D gaussian blur to widen narrow FFT peaks so they become visible
   - gamma compression to brighten sidelobes
   - order markers to show where theoretical maxima should lie
   - aesthetic Fraunhofer fan restored
*/

const VISUAL_ANGLE_GAIN = 12.0; // extreme visual exaggeration

class GratingFFTSimulation {
  constructor(cvs, ctx, density = 600, wavelength = 500e-9, slitWidth = 2e-6, distanceToScreen = 2.0) {
    this.cvs = cvs;
    this.c = ctx;

    // physics params
    this.density = Number(density);        // slits per mm
    this.wavelength = Number(wavelength);  // meters
    this.physicalSlitWidth = Number(slitWidth); // meters
    this.distanceToScreen = Math.max(1.0, Math.min(2.0, Number(distanceToScreen))); // meters

    // visual params
    this.visualSlitFactor = 2.2; // visual gap factor
    this.beamFraction = 0.5; // illuminated region is half canvas width

    // FFT params
    this.fftSize = 16384; // large for resolution; lower if performance issues
    this.fftRe = null;
    this.fftIm = null;

    // animation / update
    this.t = 0;
    this.dt = 1 / 60;

    // rendering tweaks
    this.intensityGamma = 0.6; // brighten sidelobes: v -> v^gamma (gamma < 1)
    this.blurSigmaPx = 2.0;    // gaussian blur sigma in pixels for screen intensity

    this.color = w2h(this.wavelength);
    this.redraw = true;
    this.screenIntensity = null;

    this.resize();
  }

  // px -> meters mapping. Set to 0.25 µm/px (strong tightening)
  get xpx2m() {
    return 0.25e-6;
  }

  resize() {
    // preview region
    this.screen = {
      x: Math.round(this.cvs.width / 2),
      y: Math.round(0.25 * this.cvs.height),
      w: Math.round(this.cvs.width * 0.95)
    };

    // grating positions
    this.gratingY = Math.round(this.cvs.height * 0.9);
    this.gratingX = Math.round(this.cvs.width / 2);

    // illuminated width (half canvas)
    this.illuminatedWidthPx = Math.round(this.cvs.width * this.beamFraction);

    // two Grating objects: aperture (physical) and visual (larger gaps)
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

  /* -----------------------------
     In-place radix-2 FFT (Cooley-Tukey)
     ----------------------------- */
  fftComplex(real, imag) {
    const n = real.length;

    // bit reversal
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        const tr = real[i]; real[i] = real[j]; real[j] = tr;
        const ti = imag[i]; imag[i] = imag[j]; imag[j] = ti;
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

  /* -----------------------------
     compute spectrum (power) and normalize
     ----------------------------- */
  computeSpec() {
    this.fftRe.set(this.aperture);
    this.fftIm.fill(0);

    this.fftComplex(this.fftRe, this.fftIm);

    const N = this.fftSize;
    const spec = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const mag = this.fftRe[i] * this.fftRe[i] + this.fftIm[i] * this.fftIm[i];
      const j = (i + N / 2) & (N - 1);
      spec[j] = mag;
    }

    // normalize
    let max = 0;
    for (let i = 0; i < N; i++) if (spec[i] > max) max = spec[i];
    if (max > 0) for (let i = 0; i < N; i++) spec[i] /= max;

    return spec;
  }

  /* -----------------------------
     Map spectrum bins → screen pixels
     with VISUAL_ANGLE_GAIN applied to theta
     ----------------------------- */
  fftToScreen(spec) {
    const N = spec.length;
    const apertureMeters = this.illuminatedWidthPx * this.xpx2m;

    const screenIntensity = new Float32Array(this.cvs.width);
    screenIntensity.fill(0);

    for (let k = 0; k < N; k++) {
      const fx = (k - N / 2) / apertureMeters; // cycles per meter
      const sinTheta = fx * this.wavelength;   // sinθ = λ · fx
      if (Math.abs(sinTheta) > 1) continue;
      let theta = Math.asin(sinTheta);

      // apply visualization gain (extreme)
      theta *= VISUAL_ANGLE_GAIN;

      const x = Math.round(this.cvs.width / 2 + Math.tan(theta) * this.distanceToScreen / this.xpx2m);
      if (x >= 0 && x < this.cvs.width) screenIntensity[x] += spec[k];
    }

    // normalize
    let max = 0;
    for (let i = 0; i < screenIntensity.length; i++) if (screenIntensity[i] > max) max = screenIntensity[i];
    if (max > 0) for (let i = 0; i < screenIntensity.length; i++) screenIntensity[i] /= max;
    return screenIntensity;
  }

  /* -----------------------------
     1D Gaussian blur (simple, CPU-bound but small kernel)
     ----------------------------- */
  blur1D(array, sigmaPx = 2.0) {
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

  /* -----------------------------
     Draw vertical markers for theoretical orders (diagnostic)
     ----------------------------- */
  drawOrderMarkers(maxM = 8) {
    const ctx = this.c;
    ctx.save();
    ctx.strokeStyle = "#FF4444";
    ctx.fillStyle = "#FF4444";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.font = "12px Arial";
    ctx.textAlign = "left";

    const d = 1 / (this.density * 1e3); // center-to-center spacing in meters

    for (let m = 1; m <= maxM; m++) {
      const sinTheta = (m * this.wavelength) / d;
      if (Math.abs(sinTheta) >= 1) break;
      let theta = Math.asin(sinTheta);
      theta *= VISUAL_ANGLE_GAIN;
      const x = Math.round(this.cvs.width / 2 + Math.tan(theta) * this.distanceToScreen / this.xpx2m);
      if (x < 0 || x > this.cvs.width) continue;
      ctx.beginPath();
      ctx.moveTo(x, this.screen.y - 18);
      ctx.lineTo(x, this.gratingY + 18);
      ctx.stroke();
      ctx.fillText(`m=${m}`, x + 6, this.screen.y - 20);
    }

    ctx.restore();
  }

  /* -----------------------------
     Update / render loop
     ----------------------------- */
  update = () => {
    this.t += this.dt;

    if (this.redraw) {
      this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);

      // visual grating line (larger visual gaps)
      this.gratingVisual.draw(this.xpx2m);

      // rebuild aperture and compute spec
      this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);
      const spec = this.computeSpec();

      // map to screen (raw)
      let screen = this.fftToScreen(spec);

      // blur narrow spikes so peaks are visible on-screen
      screen = this.blur1D(screen, this.blurSigmaPx);

      // gamma brighten small sidelobes
      for (let i = 0; i < screen.length; i++) {
        screen[i] = Math.pow(screen[i], this.intensityGamma);
      }

      // normalize again after processing
      let max = 0;
      for (let v of screen) if (v > max) max = v;
      if (max > 0) for (let i = 0; i < screen.length; i++) screen[i] /= max;

      this.screenIntensity = screen;

      // draw top intensity plot (use processed spec with gamma for visibility)
      this.drawIntensityPlot(spec);
      // draw order markers (diagnostic)
      this.drawOrderMarkers(10);

      // draw bottom screen slice (processed screenIntensity)
      this.drawScreenSlice(this.screenIntensity);

      this.redraw = false;
    }

    // draw middle Fraunhofer fan (aesthetic)
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
      let v = spec[idx] || 0;
      v = Math.pow(v, this.intensityGamma); // brighten for visibility
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
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, baseY + 2 + y, 1, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  // simple Fraunhofer fan between grating and screen (aesthetic)
  renderWaveFan() {
    if (!this.screenIntensity) return;
    const ctx = this.c;
    const top = this.screen.y + 10;
    const bottom = this.gratingY - 10;
    const height = bottom - top;
    if (height <= 0) return;

    const slices = 40;
    for (let s = 0; s < slices; s++) {
      const frac = s / (slices - 1);
      const y = Math.round(top + frac * height);
      const att = 1 - 0.85 * frac;
      for (let x = 0; x < this.cvs.width; x += 3) {
        const v = this.screenIntensity[x] || 0;
        if (v < 0.005) continue;
        ctx.globalAlpha = Math.min(1, v * att * 1.2);
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, 2, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  // preview canvas used by sim6.js
  drawScreenView = (screenCtx, width, height) => {
    if (!this.screenIntensity) {
      const spec = this.computeSpec();
      let screen = this.fftToScreen(spec);
      screen = this.blur1D(screen, this.blurSigmaPx);
      for (let i = 0; i < screen.length; i++) screen[i] = Math.pow(screen[i], this.intensityGamma);
      let max = 0;
      for (let v of screen) if (v > max) max = v;
      if (max > 0) for (let i = 0; i < screen.length; i++) screen[i] /= max;
      this.screenIntensity = screen;
    }

    screenCtx.clearRect(0, 0, width, height);
    for (let x = 0; x < width; x++) {
      const idx = Math.floor((x / width) * this.cvs.width);
      const v = this.screenIntensity[idx] || 0;
      screenCtx.fillStyle = interpolate(0, this.color, v);
      screenCtx.fillRect(x, 0, 1, height);
    }
  };

  /* -----------------------------
     UI setters
  ----------------------------- */
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
