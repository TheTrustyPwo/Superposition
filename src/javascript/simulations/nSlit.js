// simulations/nSlit.js
// Grating-only FFT Fraunhofer simulation with connect-the-maxima envelope (Option C).
// Exports: GratingFFTSimulation

import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

/* Tunables */
const VISUAL_ANGLE_GAIN = 12.0; // visual exaggeration (kept)
const COMPRESS = 0.15;          // vertical compression (kept)
const USE_XPX2M = 0.25e-6;      // px -> m mapping (kept)
const BRIGHTNESS_BOOST = 1.4;   // post-normalization intensity boost for visibility

class GratingFFTSimulation {
  constructor(cvs, ctx, density = 600, wavelength = 500e-9, slitWidth = 2e-6, distanceToScreen = 2.0) {
    this.cvs = cvs;
    this.c = ctx;

    // physical
    this.density = Number(density);
    this.wavelength = Number(wavelength);
    this.physicalSlitWidth = Number(slitWidth);
    this.distanceToScreen = Math.max(1.0, Math.min(2.0, Number(distanceToScreen)));

    // visual / rendering
    this.visualSlitFactor = 2.2;
    this.beamFraction = 0.5;
    this.intensityGamma = 0.6;
    this.blurSigmaPx = 2.0;
    this.fftSize = 16384;

    // dynamic state
    this.fftRe = null;
    this.fftIm = null;
    this.aperture = null;
    this.screenIntensity = null; // processed
    this.intensity = null;       // alias as requested by sim6.js
    this.color = w2h(this.wavelength);

    this.redraw = true;

    // time
    this.t = 0;
    this.dt = 1 / 60;

    this.resize();
  }

  get xpx2m() {
    return USE_XPX2M;
  }

  resize() {
    // preview region (top)
    this.screen = {
      x: Math.round(this.cvs.width / 2),
      y: Math.round(0.25 * this.cvs.height),
      w: Math.round(this.cvs.width * 0.95)
    };

    // grating position (visual)
    this.gratingY = Math.round(this.cvs.height * 0.9);
    this.gratingX = Math.round(this.cvs.width / 2);

    // illuminated width in pixels (fixed to half canvas)
    this.illuminatedWidthPx = Math.round(this.cvs.width * this.beamFraction);

    // Grating objects: aperture uses physical slit width; visual uses larger gap for visibility
    this.gratingAperture = new Grating(
      this.cvs, this.c,
      this.gratingX, this.gratingY,
      this.illuminatedWidthPx, this.density, this.physicalSlitWidth
    );
    const visualSlitW = Math.max(this.physicalSlitWidth, this.physicalSlitWidth * this.visualSlitFactor);
    this.gratingVisual = new Grating(
      this.cvs, this.c,
      this.gratingX, this.gratingY,
      this.illuminatedWidthPx, this.density, visualSlitW
    );

    this.fftRe = new Float32Array(this.fftSize);
    this.fftIm = new Float32Array(this.fftSize);
    this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);

    this.redraw = true;
    this.screenIntensity = null;
  }

  /* ---------------------------
     FFT (in-place radix-2)
     --------------------------- */
  fftComplex(real, imag) {
    const n = real.length;
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

  /* ---------------------------
     Compute spectrum & compression (Option C uses I^(1/4) compress)
     --------------------------- */
  computeSpec() {
    this.fftRe.set(this.aperture);
    this.fftIm.fill(0);

    this.fftComplex(this.fftRe, this.fftIm);

    const N = this.fftSize;
    const intensity = new Float32Array(N);
    for (let i = 0; i < N; i++) intensity[i] = this.fftRe[i] * this.fftRe[i] + this.fftIm[i] * this.fftIm[i];

    // dynamic-range compression (I^(1/4))
    for (let i = 0; i < N; i++) intensity[i] = Math.pow(intensity[i], 0.25);

    // normalize
    let maxI = 0;
    for (let i = 0; i < N; i++) if (intensity[i] > maxI) maxI = intensity[i];
    if (maxI > 0) for (let i = 0; i < N; i++) intensity[i] /= maxI;

    // shift (center DC)
    const spec = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const j = (i + N / 2) & (N - 1);
      spec[j] = intensity[i];
    }
    return spec;
  }

  /* ---------------------------
     Map FFT -> screen with angle gain and vertical compress
     --------------------------- */
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

      // exaggerate visually
      theta *= VISUAL_ANGLE_GAIN;

      // physical distance on screen
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

  /* ---------------------------
     1D Gaussian blur
     --------------------------- */
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

  /* ---------------------------
     Build processed intensity pipeline
     --------------------------- */
  computeProcessedIntensity() {
    const spec = this.computeSpec();               // compressed & normalized spectrum
    let screen = this.fftToScreen(spec);           // map to pixel x

    // widen narrow spikes
    screen = this.blur1D(screen, this.blurSigmaPx);

    // gamma brighten small sidelobes
    for (let i = 0; i < screen.length; i++) screen[i] = Math.pow(screen[i], this.intensityGamma);

    // normalize
    let max = 0;
    for (let v of screen) if (v > max) max = v;
    if (max > 0) for (let i = 0; i < screen.length; i++) screen[i] /= max;

    // brightness boost for better visual appearance (then clamp)
    for (let i = 0; i < screen.length; i++) {
      screen[i] = Math.min(1, screen[i] * BRIGHTNESS_BOOST);
    }

    this.screenIntensity = screen;
    this.intensity = screen; // alias for sim6.js
    return { spec, screen };
  }

  /* ---------------------------
     Make an envelope by connecting maxima then smoothing
     (Option C)
     --------------------------- */
  buildMaximaEnvelope(screenIntensity) {
    const N = screenIntensity.length;
    const env = new Float32Array(N);

    // find simple local maxima (coarse)
    for (let x = 2; x < N - 2; x++) {
      const v = screenIntensity[x] || 0;
      if (v <= 0.01) continue; // skip tiny noise
      if (v > screenIntensity[x - 1] && v >= screenIntensity[x + 1]) {
        env[x] = v;
      }
    }

    // smooth/connect maxima into continuous envelope (big blur)
    const smooth = this.blur1D(env, 24.0); // large sigma to connect peaks
    // normalize again so envelope peaks match screen peaks scale
    let max = 0;
    for (let v of smooth) if (v > max) max = v;
    if (max > 0) for (let i = 0; i < smooth.length; i++) smooth[i] /= max;

    return smooth;
  }

  /* ---------------------------
     Draw white dashed envelope (connect-the-maxima)
     --------------------------- */
  drawDottedEnvelope(envelope) {
    const ctx = this.c;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([6, 6]); // dotted/dashed
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#FFFFFF"; // white
    for (let x = 0; x < this.cvs.width; x++) {
      const v = envelope[x] || 0;
      const y = (this.screen.y - 5) - v * (this.cvs.height * 0.18) * 1.15; // scale slightly taller
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* ---------------------------
     Draw green intensity curve (detailed)
     --------------------------- */
  drawGreenCurveFromSpec(spec) {
    const ctx = this.c;
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = i2h(this.color);
    const N = spec.length;
    for (let x = 0; x < this.cvs.width; x++) {
      const idx = Math.floor((x / this.cvs.width) * N);
      let v = spec[idx] || 0;
      v = Math.pow(v, this.intensityGamma);
      const y = (this.screen.y - 5) - v * (this.cvs.height * 0.18);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* ---------------------------
     Baseline (white) — *moved below slits*
     We'll draw this below the slit line so it does not overlap the slits visually.
     --------------------------- */
  drawWhiteBaseline() {
    const ctx = this.c;
    // baseline slightly below the slits (slits at gratingY), so baseline at gratingY + 6
    const baselineY = this.gratingY + 6;
    ctx.save();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(this.cvs.width, baselineY);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------------------------
     Draw the dotted/light separator just above the screen area,
     then render the actual screen pixels below it.
     --------------------------- */
  drawScreenSlice(screenIntensity) {
    const ctx = this.c;
    const topOfScreen = this.gratingY + 10; // pixels below the slits

    // light separator (thin grey) at top of screen area
    ctx.save();
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.gratingY + 4);
    ctx.lineTo(this.cvs.width, this.gratingY + 4);
    ctx.stroke();
    ctx.restore();

    // draw intensity pixels/dots under topOfScreen
    for (let x = 0; x < this.cvs.width; x++) {
      const v = screenIntensity[x] || 0;
      const h = Math.round(v * (this.cvs.height * 0.45));
      if (h <= 0) continue;
      for (let y = 0; y < h; y += 2) {
        const alpha = Math.min(1, 0.25 + 0.75 * (y / h));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, topOfScreen + 2 + y, 2, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------------------
     Draw maxima markers (white rings)
     --------------------------- */
  drawMaximaMarkers(screenIntensity, maxMarkers = 8) {
    const ctx = this.c;
    const peaks = [];
    for (let x = 2; x < screenIntensity.length - 2; x++) {
      const v = screenIntensity[x] || 0;
      if (v <= 0.02) continue;
      if (v > screenIntensity[x - 1] && v >= screenIntensity[x + 1]) peaks.push({ x, v });
    }
    peaks.sort((a, b) => b.v - a.v);
    ctx.save();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < Math.min(maxMarkers, peaks.length); i++) {
      const p = peaks[i];
      const y = this.gratingY + 2 + 2; // slightly below slits
      ctx.beginPath();
      ctx.arc(p.x, y, 6 + i * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------------------------
     Aesthetic Fraunhofer fan (restored)
     --------------------------- */
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
        ctx.globalAlpha = Math.min(1, v * att * 1.6);
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, 2, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------------------
     drawScreenView (preview)
     --------------------------- */
  drawScreenView = (screenCtx, width, height) => {
    if (!this.screenIntensity) {
      this.computeProcessedIntensity();
    }
    screenCtx.clearRect(0, 0, width, height);
    for (let x = 0; x < width; x++) {
      const idx = Math.floor((x / width) * this.cvs.width);
      const v = this.screenIntensity[idx] || 0;
      screenCtx.fillStyle = interpolate(0, this.color, v);
      screenCtx.fillRect(x, 0, 1, height);
    }
  };

  /* ---------------------------
     Main update loop
     --------------------------- */
  update = () => {
    this.t += this.dt;

    if (this.redraw) {
      // clear canvas
      this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);

      // draw the visual slit line first
      this.gratingVisual.draw(this.xpx2m);

      // compute intensity
      const { spec, screen } = this.computeProcessedIntensity();

      // set alias
      this.screenIntensity = screen;
      this.intensity = screen;

      // draw baseline below slits (so slits are not covered)
      this.drawWhiteBaseline();

      // build connect-the-maxima envelope (smoothed)
      const envelope = this.buildMaximaEnvelope(screen);

      // draw dashed white envelope (on top)
      this.drawDottedEnvelope(envelope);

      // draw green intensity curve (detailed) on top of envelope
      this.drawGreenCurveFromSpec(spec);

      // draw maxima markers (white)
      this.drawMaximaMarkers(screen, 10);

      // draw screen area (dotted bright pixels) below baseline
      this.drawScreenSlice(screen);

      this.redraw = false;
    }

    // always render fan
    this.renderWaveFan();
  };

  /* ---------------------------
     UI setters
     --------------------------- */
  setDensity = (density) => {
    this.density = Number(density);
    this.gratingAperture.density = this.density;
    this.gratingVisual.density = this.density;
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
