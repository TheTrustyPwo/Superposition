import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

/* -----------------------
   Tunables & constants
   ----------------------- */
const DEFAULT_FFT_SIZE = 16384;  // reduce if performance issues
const XPX2M = 0.25e-6;           // meters per pixel (tight mapping so orders fall on canvas)
const VISUAL_GAIN = 8.0;         // visual exaggeration of angle (helps show orders)
const BLUR_SIGMA_PX = 2.4;       // widen spikes so sidelobes show
const ENVELOPE_BLUR = 10.0;      // smoothing when drawing white curve
const BEAM_FRACTION = 0.5;       // illuminated region fraction (half canvas)
const SCREEN_LINE_OFFSET = 6;    // position of colored pixels relative to gratingY
const MAX_FFT_SIZE_SAFE = 32768; // upper cap if needed

class GratingFFTSimulation {
  constructor(cvs, c, density = 600, wavelength = 500e-9, slitWidth = 2e-6, distanceToScreen = 2.0) {
    this.cvs = cvs;
    this.c = c;

    // physical parameters
    this.density = Number(density);            // slits per mm
    this.wavelength = Number(wavelength);      // meters
    this.physicalSlitWidth = Number(slitWidth);
    this.distanceToScreen = Math.max(1.0, Math.min(2.0, Number(distanceToScreen))); // 1..2 m

    // visual
    this.visualSlitFactor = 2.2;               // visual gap multiplier so slits remain visible
    this.beamFraction = BEAM_FRACTION;

    // FFT
    this.fftSize = Math.min(DEFAULT_FFT_SIZE, MAX_FFT_SIZE_SAFE);
    this.fftRe = null;
    this.fftIm = null;

    // state
    this.aperture = null;
    this.screenIntensity = null; // per-pixel intensity (0..1)
    this.color = w2h(this.wavelength); // hex color string
    this.redraw = true;

    // time
    this.t = 0;
    this.dt = 1 / 60;

    this.resize();
  }

  // px -> meters mapping
  get xpx2m() {
    return XPX2M;
  }

  /* -----------------------
     Geometry / rebuild
     ----------------------- */
  resize() {
    // preview region (top)
    this.screen = {
      x: Math.round(this.cvs.width / 2),
      y: Math.round(0.25 * this.cvs.height),
      w: Math.round(this.cvs.width * 0.95)
    };

    // grating visual position
    this.gratingY = Math.round(this.cvs.height * 0.9);
    this.gratingX = Math.round(this.cvs.width / 2);

    // illuminated width in px (fixed fraction)
    this.illuminatedWidthPx = Math.round(this.cvs.width * this.beamFraction);

    // create grating helpers
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

    // allocate FFT arrays
    this.fftRe = new Float32Array(this.fftSize);
    this.fftIm = new Float32Array(this.fftSize);

    // aperture built on redraw
    this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);

    this.screenIntensity = null;
    this.redraw = true;
  }

  /* -----------------------
     FFT (in-place radix-2)
     ----------------------- */
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
    // Cooley-Tukey
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
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

  /* -----------------------
     Compute normalized power spectrum (with center shift)
     ----------------------- */
  computeSpec() {
    // copy aperture -> real part, zero imag
    this.fftRe.set(this.aperture);
    this.fftIm.fill(0);

    // do FFT
    this.fftComplex(this.fftRe, this.fftIm);

    const N = this.fftSize;
    const spec = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const mag = this.fftRe[i] * this.fftRe[i] + this.fftIm[i] * this.fftIm[i];
      // center-shift so DC in middle
      const j = (i + N / 2) & (N - 1);
      spec[j] = mag;
    }

    // normalize to max 1
    let max = 0;
    for (let i = 0; i < N; i++) if (spec[i] > max) max = spec[i];
    if (max > 0) {
      for (let i = 0; i < N; i++) spec[i] /= max;
    }
    return spec;
  }

  /* -----------------------
     Map spectrum -> screen pixels
     sinθ = λ · f  where f is spatial frequency (cycles/m)
     Then map θ to lateral displacement on screen: x = tanθ · D
     ----------------------- */
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

      // small visual exaggeration to keep orders visible
      theta *= VISUAL_GAIN;

      const physicalX = Math.tan(theta) * this.distanceToScreen;
      const px = Math.round(this.cvs.width / 2 + physicalX / this.xpx2m);
      if (px >= 0 && px < this.cvs.width) screen[px] += spec[k];
    }

    // normalize 0..1
    let max = 0;
    for (let i = 0; i < screen.length; i++) if (screen[i] > max) max = screen[i];
    if (max > 0) for (let i = 0; i < screen.length; i++) screen[i] /= max;
    return screen;
  }

  /* -----------------------
     1D Gaussian blur (returns new Float32Array)
     ----------------------- */
  blur1D(arr, sigma = BLUR_SIGMA_PX) {
    const radius = Math.ceil(sigma * 3);
    const size = radius * 2 + 1;
    const kernel = new Float32Array(size);
    let sum = 0;
    for (let i = -radius; i <= radius; i++) {
      const v = Math.exp(-0.5 * (i * i) / (sigma * sigma));
      kernel[i + radius] = v;
      sum += v;
    }
    for (let i = 0; i < size; i++) kernel[i] /= sum;
    const N = arr.length;
    const out = new Float32Array(N);
    for (let x = 0; x < N; x++) {
      let val = 0;
      for (let k = -radius; k <= radius; k++) {
        const ix = x + k;
        if (ix < 0 || ix >= N) continue;
        val += arr[ix] * kernel[k + radius];
      }
      out[x] = val;
    }
    return out;
  }

  /* -----------------------
     Build processed intensity (mode 1: normalize highest peak to 1)
     Returns { spec, screen }
     ----------------------- */
  computeProcessedIntensity() {
    // rebuild aperture then compute spec & map to screen
    this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);
    const spec = this.computeSpec();
    let screen = this.fftToScreen(spec);

    // widen narrow spikes so secondary maxima show
    screen = this.blur1D(screen, BLUR_SIGMA_PX);

    // normalize so highest peak is 1 (mode 1)
    let max = 0;
    for (let v of screen) if (v > max) max = v;
    if (max > 0) {
      for (let i = 0; i < screen.length; i++) screen[i] /= max;
    }

    this.screenIntensity = screen;
    return { spec, screen };
  }

  /* -----------------------
     Draw the white intensity curve (smoothed)
     ----------------------- */
  drawWhiteIntensityCurve(spec) {
    const ctx = this.c;
    const N = spec.length;
    // downsample spec to canvas width with block average
    const block = Math.max(1, Math.floor(N / this.cvs.width));
    const down = new Float32Array(this.cvs.width);
    for (let x = 0; x < this.cvs.width; x++) {
      let sum = 0, count = 0;
      const start = x * block;
      const end = Math.min(N, start + block);
      for (let k = start; k < end; k++) { sum += spec[k]; count++; }
      down[x] = count ? sum / count : 0;
    }

    // smooth heavily to make a clear white curve
    const smooth = this.blur1D(down, ENVELOPE_BLUR);

    // normalize
    let max = 0;
    for (let v of smooth) if (v > max) max = v;
    const scale = max > 0 ? 1 / max : 1;

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = "#FFFFFF";
    for (let x = 0; x < this.cvs.width; x++) {
      const v = smooth[x] * scale;
      const y = (this.screen.y - 5) - v * (this.cvs.height * 0.23);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* -----------------------
     Draw colored screen pixels under slits (no baseline overlapping slits)
     ----------------------- */
  drawScreenSlice(screenIntensity) {
    const ctx = this.c;
    const topOfPixels = this.gratingY + SCREEN_LINE_OFFSET; // start of colored pixels (below slits)
    // draw colored pixels
    for (let x = 0; x < this.cvs.width; x++) {
      const v = screenIntensity[x] || 0;
      const h = Math.round(v * (this.cvs.height * 0.45));
      if (h <= 0) continue;
      // color is monochromatic hex string this.color (from w2h)
      for (let y = 0; y < h; y += 3) {
        const alpha = Math.min(1, 0.2 + 0.8 * (y / Math.max(1, h)));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, topOfPixels + 2 + y, 2, 2);
      }
    }
    ctx.globalAlpha = 1;

    // draw single white screen baseline **below** the slits but above colored pixels? 
    // We will place a thin white line a few pixels above the colored pixels so it does not overlap the slit line.
    ctx.save();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    const baselineY = topOfPixels - 6; // place it above the colored pixels, safely below the slits
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(this.cvs.width, baselineY);
    ctx.stroke();
    ctx.restore();
  }

  /* -----------------------
     Aesthetic fan between grating and screen (keeps "waves in middle")
     ----------------------- */
  renderWaveFan() {
    if (!this.screenIntensity) return;
    const ctx = this.c;
    const top = this.screen.y + 10;
    const bottom = this.gratingY - 10;
    const height = bottom - top;
    if (height <= 0) return;

    const slices = 32;
    for (let s = 0; s < slices; s++) {
      const frac = s / (slices - 1);
      const y = Math.round(top + frac * height);
      const att = 1 - 0.9 * frac;
      for (let x = 0; x < this.cvs.width; x += 3) {
        const v = this.screenIntensity[x] || 0;
        if (v < 0.006) continue;
        ctx.globalAlpha = Math.min(1, v * att * 1.6);
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, 2, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* -----------------------
     Preview: drawScreenView (called from sim6.js)
     Draws colored preview and single white line at top of preview.
     ----------------------- */
  drawScreenView = (screenCtx, width, height) => {
    if (!this.screenIntensity || !this.screenIntensity.length) {
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

    // single white line at very top of preview (no slits drawn here)
    screenCtx.strokeStyle = "#FFFFFF";
    screenCtx.lineWidth = 2;
    screenCtx.beginPath();
    screenCtx.moveTo(0, 2);
    screenCtx.lineTo(width, 2);
    screenCtx.stroke();
  };

  /* -----------------------
     Main update loop
     ----------------------- */
  update = () => {
    this.t += this.dt;

    if (this.redraw) {
      // clear full canvas
      this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);

      // draw slits visually first (the Grating.draw will draw substrate line + slit ticks/gaps).
      // We do not draw any other long horizontal lines that would overlap the slit.
      this.gratingVisual.draw(this.xpx2m);

      // compute intensity (aperture -> spec -> screen)
      const { spec, screen } = this.computeProcessedIntensity();

      // store for preview & fans
      this.screenIntensity = screen;

      // draw white intensity curve above slits
      this.drawWhiteIntensityCurve(spec);

      // draw colored pixels (screen) beneath slits (baseline drawn below slits)
      this.drawScreenSlice(screen);

      this.redraw = false;
    } else {
      // clear only the region between top preview and grating for incremental redraws
      this.c.clearRect(0, this.screen.y + 2.5, this.cvs.width, this.gratingY - this.screen.y - 5);
    }

    // always render the aesthetic wave fan (so waves in middle are visible)
    this.renderWaveFan();
  };

  /* -----------------------
     UI setters
     ----------------------- */
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
