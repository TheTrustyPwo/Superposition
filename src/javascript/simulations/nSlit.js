// simulations/nSlit.js
// Grating-only FFT Fraunhofer simulation (grating mode).
// Exports: GratingFFTSimulation

import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

/*
  Visualization tuning:
    - VISUAL_ANGLE_GAIN amplifies theta for visibility (keeps relative ordering)
    - COMPRESS scales physical y = D*tan(theta) down to fit canvas (0.15 chosen)
    - xpx2m maps pixels -> meters (0.25 µm/px)
*/

const VISUAL_ANGLE_GAIN = 12.0; // visual exaggeration of theta
const COMPRESS = 0.15;          // compress physical y by this factor to bring orders on-screen

class GratingFFTSimulation {
  constructor(cvs, ctx, density = 600, wavelength = 500e-9, slitWidth = 2e-6, distanceToScreen = 2.0) {
    this.cvs = cvs;
    this.c = ctx;

    // physical parameters
    this.density = Number(density);           // slits per mm
    this.wavelength = Number(wavelength);     // m
    this.physicalSlitWidth = Number(slitWidth);// m
    this.distanceToScreen = Math.max(1.0, Math.min(2.0, Number(distanceToScreen))); // m

    // visual helpers
    this.visualSlitFactor = 2.2; // enlarge visual gaps
    this.beamFraction = 0.5;     // illuminated width fraction of canvas

    // FFT params
    this.fftSize = 16384; // change down if needed for perf
    this.fftRe = null;
    this.fftIm = null;

    // animation
    this.t = 0;
    this.dt = 1 / 60;

    // rendering tweaks
    this.intensityGamma = 0.6; // brighten sidelobes
    this.blurSigmaPx = 2.0;    // gaussian blur sigma (px)

    this.color = w2h(this.wavelength);
    this.redraw = true;
    this.screenIntensity = null;

    this.resize();
  }

  // px -> m mapping: strong tightening (0.25 µm per px)
  get xpx2m() {
    return 0.25e-6;
  }

  resize() {
    // preview region coordinates
    this.screen = {
      x: Math.round(this.cvs.width / 2),
      y: Math.round(0.25 * this.cvs.height),
      w: Math.round(this.cvs.width * 0.95)
    };

    // grating position
    this.gratingY = Math.round(this.cvs.height * 0.9);
    this.gratingX = Math.round(this.cvs.width / 2);

    // illuminated width in px
    this.illuminatedWidthPx = Math.round(this.cvs.width * this.beamFraction);

    // construct two gratings:
    // - gratingAperture: physical slit width used to build aperture for FFT
    // - gratingVisual: slightly larger visual slit width for visible gaps
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
     Compute normalized power spectrum
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
     Map spectrum bins to screen with angle gain + compression
     ----------------------------- */
  fftToScreen(spec) {
    const N = spec.length;
    const apertureMeters = this.illuminatedWidthPx * this.xpx2m;

    const screen = new Float32Array(this.cvs.width);
    screen.fill(0);

    for (let k = 0; k < N; k++) {
      const fx = (k - N / 2) / apertureMeters; // cycles per meter
      const sinTheta = fx * this.wavelength;   // sinθ = λ·fx
      if (Math.abs(sinTheta) > 1) continue;
      let theta = Math.asin(sinTheta);

      // visual exaggeration of angle
      theta *= VISUAL_ANGLE_GAIN;

      // physical y on screen: D * tan(theta)
      // then compress it to fit canvas: * COMPRESS
      const physicalY = this.distanceToScreen * Math.tan(theta);
      const compressedY = physicalY * COMPRESS;

      const x = Math.round(this.cvs.width / 2 + compressedY / this.xpx2m);
      if (x >= 0 && x < this.cvs.width) screen[x] += spec[k];
    }

    // normalize
    let max = 0;
    for (let i = 0; i < screen.length; i++) if (screen[i] > max) max = screen[i];
    if (max > 0) for (let i = 0; i < screen.length; i++) screen[i] /= max;

    return screen;
  }

  /* -----------------------------
     1D Gaussian blur to widen narrow peaks
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
     Draw vertical markers for theoretical orders
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

    const d = 1 / (this.density * 1e3); // meters

    for (let m = 1; m <= maxM; m++) {
      const sinTheta = (m * this.wavelength) / d;
      if (Math.abs(sinTheta) >= 1) break;
      let theta = Math.asin(sinTheta);
      theta *= VISUAL_ANGLE_GAIN;
      const physicalY = this.distanceToScreen * Math.tan(theta);
      const compressedY = physicalY * COMPRESS;
      const x = Math.round(this.cvs.width / 2 + compressedY / this.xpx2m);
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
     Main update loop
     ----------------------------- */
  update = () => {
    this.t += this.dt;

    if (this.redraw) {
      this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);

      // draw visual grating line
      this.gratingVisual.draw(this.xpx2m);

      // compute aperture & spectrum
      this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);
      const spec = this.computeSpec();

      // raw mapping
      let screen = this.fftToScreen(spec);

      // blur narrow spikes
      screen = this.blur1D(screen, this.blurSigmaPx);

      // gamma brighten small sidelobes
      for (let i = 0; i < screen.length; i++) {
        screen[i] = Math.pow(screen[i], this.intensityGamma);
      }

      // normalize again
      let max = 0;
      for (let v of screen) if (v > max) max = v;
      if (max > 0) for (let i = 0; i < screen.length; i++) screen[i] /= max;

      this.screenIntensity = screen;

      // draw intensity plot (top)
      this.drawIntensityPlot(spec);

      // draw order markers for diagnosis
      this.drawOrderMarkers(10);

      // bottom screen slice
      this.drawScreenSlice(this.screenIntensity);

      this.redraw = false;
    }

    // aesthetic Fraunhofer fan
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
      v = Math.pow(v, this.intensityGamma);
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

  // preview view used by sim6.js
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
