import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

/* Tunables */
const VISUAL_ANGLE_GAIN = 12.0; // extreme angle exaggeration (you chose)
const COMPRESS = 0.15;          // compression of physical y -> screen (you chose)
const USE_XPX2M = 0.25e-6;      // 0.25 µm/px mapping (strong tightening)

class GratingFFTSimulation {
  constructor(cvs, ctx, density = 600, wavelength = 500e-9, slitWidth = 2e-6, distanceToScreen = 2.0) {
    this.cvs = cvs;
    this.c = ctx;

    // physical
    this.density = Number(density);            // lines per mm
    this.wavelength = Number(wavelength);      // m
    this.physicalSlitWidth = Number(slitWidth);// m
    this.distanceToScreen = Math.max(1.0, Math.min(2.0, Number(distanceToScreen))); // m

    // visuals / rendering
    this.visualSlitFactor = 2.2;
    this.beamFraction = 0.5;   // illuminated region: half canvas
    this.intensityGamma = 0.6; // gamma brighten sidelobes (v -> v^gamma)
    this.blurSigmaPx = 2.0;    // gaussian blur sigma for screen intensity
    this.fftSize = 16384;      // FFT resolution (reduce if slow)

    // dynamic state
    this.fftRe = null;
    this.fftIm = null;
    this.aperture = null;
    this.screenIntensity = null; // processed intensity (displayed on screen)
    this.intensity = null;       // alias to screenIntensity (keeps naming asked)
    this.color = w2h(this.wavelength);
    this.redraw = true;

    // animation/time
    this.t = 0;
    this.dt = 1 / 60;

    this.resize();
  }

  // px -> meters mapping (strong tightening)
  get xpx2m() {
    return USE_XPX2M;
  }

  /* ---------------------------
     Build / reshape resources
     --------------------------- */
  resize() {
    // preview region (top)
    this.screen = {
      x: Math.round(this.cvs.width / 2),
      y: Math.round(0.25 * this.cvs.height),
      w: Math.round(this.cvs.width * 0.95)
    };

    // physical grating location (visual)
    this.gratingY = Math.round(this.cvs.height * 0.9);
    this.gratingX = Math.round(this.cvs.width / 2);

    // illuminated width in pixels (fixed beam fraction)
    this.illuminatedWidthPx = Math.round(this.cvs.width * this.beamFraction);

    // Grating helpers: aperture (physical) and visual (larger gap for visibility)
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

    // allocate FFT arrays & build aperture
    this.fftRe = new Float32Array(this.fftSize);
    this.fftIm = new Float32Array(this.fftSize);
    this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);

    this.redraw = true;
    this.screenIntensity = null;
  }

  /* ---------------------------
     In-place radix-2 FFT
     --------------------------- */
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

  /* ---------------------------
     Compute spectrum (power) & apply Option C compression
     --------------------------- */
  computeSpec() {
    // copy aperture into re[], zero imag
    this.fftRe.set(this.aperture);
    this.fftIm.fill(0);

    this.fftComplex(this.fftRe, this.fftIm);

    const N = this.fftSize;
    // raw intensity
    const intensity = new Float32Array(N);
    for (let i = 0; i < N; i++) intensity[i] = this.fftRe[i] * this.fftRe[i] + this.fftIm[i] * this.fftIm[i];

    // -------- OPTION C: dynamic-range compression (I^(1/4)) ----------
    for (let i = 0; i < N; i++) intensity[i] = Math.pow(intensity[i], 0.25);
    // normalize
    let maxI = 0;
    for (let i = 0; i < N; i++) if (intensity[i] > maxI) maxI = intensity[i];
    if (maxI > 0) for (let i = 0; i < N; i++) intensity[i] /= maxI;
    // -----------------------------------------------------------------

    // shift center (so DC is mid)
    const spec = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const j = (i + N / 2) & (N - 1);
      spec[j] = intensity[i];
    }
    return spec;
  }

  /* ---------------------------
     Map FFT spectrum → screen pixels
     (with VISUAL_ANGLE_GAIN and vertical COMPRESS)
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

      // visual exaggeration
      theta *= VISUAL_ANGLE_GAIN;

      // physical y = D * tan(theta)
      const physicalY = this.distanceToScreen * Math.tan(theta);
      // compress to fit the canvas
      const compressedY = physicalY * COMPRESS;
      // map compressed Y to pixel offset
      const x = Math.round(this.cvs.width / 2 + compressedY / this.xpx2m);
      if (x >= 0 && x < this.cvs.width) screen[x] += spec[k];
    }

    // normalize screen intensity
    let max = 0;
    for (let i = 0; i < screen.length; i++) if (screen[i] > max) max = screen[i];
    if (max > 0) for (let i = 0; i < screen.length; i++) screen[i] /= max;
    return screen;
  }

  /* ---------------------------
     1D Gaussian blur for widening narrow FFT peaks
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
     Compute processed intensity array (pipeline)
     - computeSpec -> fftToScreen -> blur -> gamma -> normalize
     - sets this.screenIntensity and this.intensity
     --------------------------- */
  computeProcessedIntensity() {
    const spec = this.computeSpec();
    let screen = this.fftToScreen(spec);
    // widen narrow spikes
    screen = this.blur1D(screen, this.blurSigmaPx);
    // gamma brighten
    for (let i = 0; i < screen.length; i++) screen[i] = Math.pow(screen[i], this.intensityGamma);
    // normalize again
    let max = 0;
    for (let v of screen) if (v > max) max = v;
    if (max > 0) for (let i = 0; i < screen.length; i++) screen[i] /= max;

    this.screenIntensity = screen;
    this.intensity = screen; // alias for external code (you asked for this variable)
    return { spec, screen };
  }

  /* ---------------------------
     Draw envelope (smooth white curve)
     Approach: compute a smoothed envelope by low-pass filtering the 'spec'
     then map to top preview region and draw a thick white curve.
     --------------------------- */
  drawEnvelope(spec) {
    const ctx = this.c;
    const N = spec.length;
    // downsample spec to canvas width by averaging blocks
    const out = new Float32Array(this.cvs.width);
    const block = Math.floor(N / this.cvs.width) || 1;
    for (let x = 0; x < this.cvs.width; x++) {
      let sum = 0;
      const start = x * block;
      const end = Math.min(N, start + block);
      for (let k = start; k < end; k++) sum += spec[k];
      out[x] = sum / (end - start || 1);
    }
    // smooth with small blur pass (3 px)
    const smooth = this.blur1D(out, 6.0);

    // draw as white smooth curve
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#FFFFFF"; // white envelope
    for (let x = 0; x < this.cvs.width; x++) {
      const v = smooth[x] || 0;
      const y = (this.screen.y - 5) - v * (this.cvs.height * 0.18) * 1.2; // slightly taller envelope
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* ---------------------------
     Draw the green exact intensity curve (detailed)
     --------------------------- */
  drawGreenIntensityCurve(spec) {
    const ctx = this.c;
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = i2h(this.color);
    const N = spec.length;
    for (let x = 0; x < this.cvs.width; x++) {
      const idx = Math.floor((x / this.cvs.width) * N);
      let v = spec[idx] || 0;
      v = Math.pow(v, this.intensityGamma); // similar treatment for visibility
      const y = (this.screen.y - 5) - v * (this.cvs.height * 0.18);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* ---------------------------
     Draw white horizontal baseline (screen line) under curves
     --------------------------- */
  drawBaseline() {
    const ctx = this.c;
    const baseY = this.gratingY - 2; // just above the visual screen slice
    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(this.cvs.width, baseY);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------------------------
     Draw the bottom screen (dotted / pixel screen) using screenIntensity
     --------------------------- */
  drawScreenSlice(screenIntensity) {
    const ctx = this.c;
    const baseY = this.gratingY + 10;
    // draw a thin white baseline at top of screen area (keeps visual separated)
    ctx.save();
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.gratingY + 4);
    ctx.lineTo(this.cvs.width, this.gratingY + 4);
    ctx.stroke();
    ctx.restore();

    // draw intensity as stacked pixels/dots beneath baseline
    for (let x = 0; x < this.cvs.width; x++) {
      const v = screenIntensity[x] || 0;
      const h = Math.round(v * (this.cvs.height * 0.45));
      if (h <= 0) continue;
      // draw denser bright pixels for stronger visibility
      for (let y = 0; y < h; y += 2) {
        const alpha = Math.min(1, 0.2 + 0.8 * (y / h));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, baseY + 2 + y, 2, 2); // slightly larger dots
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------------------
     Draw bright markers for maxima peaks (optional small circles)
     We'll find local peaks in screenIntensity and draw small white rings.
     --------------------------- */
  drawMaximaMarkers(screenIntensity, maxMarkers = 8) {
    const ctx = this.c;
    // find local peaks (simple)
    const peaks = [];
    for (let x = 2; x < screenIntensity.length - 2; x++) {
      const v = screenIntensity[x] || 0;
      if (v <= 0.02) continue; // skip tiny noise
      if (v > screenIntensity[x - 1] && v >= screenIntensity[x + 1]) {
        peaks.push({ x, v });
      }
    }
    // sort by amplitude descending
    peaks.sort((a, b) => b.v - a.v);
    // draw top peaks up to maxMarkers
    ctx.save();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < Math.min(maxMarkers, peaks.length); i++) {
      const p = peaks[i];
      // ring slightly above baseline
      const y = this.gratingY + 2;
      ctx.beginPath();
      ctx.arc(p.x, y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------------------------
     render fan (aesthetic)
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
        ctx.globalAlpha = Math.min(1, v * att * 1.5);
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, 2, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------------------
     drawScreenView (preview canvas)
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
     Main update
     --------------------------- */
  update = () => {
    this.t += this.dt;

    if (this.redraw) {
      // clear entire canvas
      this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);

      // draw visual grating line
      this.gratingVisual.draw(this.xpx2m);

      // compute processed intensity (spec + processed screen intensity)
      const { spec, screen } = this.computeProcessedIntensity();

      // set alias
      this.screenIntensity = screen;
      this.intensity = screen;

      // white envelope (smooth)
      this.drawEnvelope(spec);

      // green detailed intensity curve
      this.drawGreenIntensityCurve(spec);

      // white horizontal baseline under curves (visible)
      this.drawBaseline();

      // show markers on screen for maxima
      this.drawMaximaMarkers(screen, 8);

      // draw screen (dotted bright pixels)
      this.drawScreenSlice(screen);

      this.redraw = false;
    }

    // always render wave fan
    this.renderWaveFan();
  };

  /* ---------------------------
     UI setters
     --------------------------- */
  setDensity = (density) => {
    this.density = Number(density);
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
    this.distanceToScreen = Math.max(1.0, Math.min(2.0, Number(distanceMeters)));
    this.redraw = true;
  };
}

export { GratingFFTSimulation };
