import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

/*
  Modified to show discrete diffraction orders as dots of light
  - Intensity profile shows peaks for each order
  - Screen view shows bright spots instead of continuous distribution
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
    this.diffractionOrders = []; // Store discrete orders

    this.resize();
  }

  get xpx2m() {
    return 0.25e-6;
  }

  resize() {
    this.screen = {
      x: Math.round(this.cvs.width / 2),
      y: Math.round(0.25 * this.cvs.height),
      w: Math.round(this.cvs.width * 0.95)
    };

    this.gratingY = Math.round(this.cvs.height * 0.9);
    this.gratingX = Math.round(this.cvs.width / 2);
    this.illuminatedWidthPx = Math.round(this.cvs.width * this.beamFraction);

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

    this.fftRe = new Float32Array(this.fftSize);
    this.fftIm = new Float32Array(this.fftSize);
    this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);

    this.redraw = true;
    this.screenIntensity = null;
  }

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

  computeSpec() {
    this.fftRe.set(this.aperture);
    this.fftIm.fill(0);
    this.fftComplex(this.fftRe, this.fftIm);

    const N = this.fftSize;
    const spec = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const mag = this.fftRe[i] * this.fftRe[i] + this.fftIm[i] * this.fftIm[i];
      const j = (i + N/2) & (N - 1);
      spec[j] = mag;
    }
    let max = 0;
    for (let i = 0; i < N; i++) if (spec[i] > max) max = spec[i];
    if (max > 0) for (let i = 0; i < N; i++) spec[i] /= max;
    return spec;
  }

  // Calculate discrete diffraction orders using grating equation
  calculateDiffractionOrders() {
    const d = 1e-3 / this.density; // grating spacing in meters
    const orders = [];
    
    // Calculate visible orders: d*sin(θ) = m*λ
    // sin(θ) = m*λ/d, and |sin(θ)| <= 1
    const maxOrder = Math.floor(d / this.wavelength);
    
    for (let m = -maxOrder; m <= maxOrder; m++) {
      const sinTheta = m * this.wavelength / d;
      if (Math.abs(sinTheta) <= 1) {
        const theta = Math.asin(sinTheta);
        // Position on screen
        const xPos = this.cvs.width/2 + Math.tan(theta) * this.distanceToScreen / this.xpx2m;
        
        // Intensity envelope (sinc function for single slit)
        const beta = Math.PI * this.physicalSlitWidth * sinTheta / this.wavelength;
        const sinc = (Math.abs(beta) < 0.001) ? 1 : Math.sin(beta) / beta;
        const intensity = sinc * sinc;
        
        if (xPos >= 0 && xPos < this.cvs.width && intensity > 0.001) {
          orders.push({ order: m, x: xPos, intensity: intensity });
        }
      }
    }
    
    return orders;
  }

  fftToScreen(spec) {
    const N = spec.length;
    const apertureMeters = this.illuminatedWidthPx * this.xpx2m;
    const screenIntensity = new Float32Array(this.cvs.width);
    screenIntensity.fill(0);

    // Use discrete orders instead of continuous FFT mapping
    this.diffractionOrders = this.calculateDiffractionOrders();
    
    // Draw Gaussian peaks at each order position
    for (const order of this.diffractionOrders) {
      const width = 15; // Width of each peak in pixels
      for (let dx = -width*2; dx <= width*2; dx++) {
        const x = Math.round(order.x + dx);
        if (x >= 0 && x < this.cvs.width) {
          const gaussian = Math.exp(-(dx*dx) / (2 * width * width));
          screenIntensity[x] += order.intensity * gaussian;
        }
      }
    }

    // normalize
    let max = 0;
    for (let i = 0; i < screenIntensity.length; i++) if (screenIntensity[i] > max) max = screenIntensity[i];
    if (max > 0) for (let i = 0; i < screenIntensity.length; i++) screenIntensity[i] /= max;
    return screenIntensity;
  }

  update = () => {
    this.t += this.dt;

    if (this.redraw) {
      this.c.clearRect(0, 0, this.cvs.width, this.cvs.height);
      this.gratingVisual.draw(this.xpx2m);

      this.aperture = this.gratingAperture.buildAperture(this.fftSize, this.xpx2m);
      const spec = this.computeSpec();
      this.screenIntensity = this.fftToScreen(spec);

      this.drawIntensityPlot(spec);
      this.drawScreenSlice(this.screenIntensity);

      this.redraw = false;
    }

    this.renderWaveFan();
  };

  drawIntensityPlot(spec) {
    const ctx = this.c;
    const topY = this.screen.y - 5;
    
    // Draw discrete peaks instead of continuous line
    ctx.lineWidth = 2;
    ctx.strokeStyle = i2h(this.color);
    
    // Draw envelope
    ctx.beginPath();
    const N = spec.length;
    for (let x = 0; x < this.cvs.width; x++) {
      const idx = Math.floor((x / this.cvs.width) * N);
      const v = spec[idx] || 0;
      const y = topY - v * (this.cvs.height * 0.18);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw sharp peaks at order positions
    ctx.lineWidth = 3;
    for (const order of this.diffractionOrders) {
      const x = order.x;
      const intensity = order.intensity;
      const h = intensity * (this.cvs.height * 0.18);
      
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, topY - h);
      ctx.stroke();
    }
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

    // Draw discrete bright spots
    for (const order of this.diffractionOrders) {
      const x = Math.round(order.x);
      const v = order.intensity;
      const h = Math.round(v * (this.cvs.height * 0.45));
      const width = 8; // Width of each spot
      
      if (h > 0) {
        for (let dx = -width; dx <= width; dx++) {
          const xPos = x + dx;
          if (xPos < 0 || xPos >= this.cvs.width) continue;
          
          const radialFade = 1 - Math.abs(dx) / width;
          for (let y = 0; y < h; y += 3) {
            const verticalFade = Math.min(1, 0.3 + 0.7 * (y / h));
            this.c.globalAlpha = verticalFade * radialFade;
            this.c.fillStyle = this.color;
            this.c.fillRect(xPos, baseY + 2 + y, 1, 2);
          }
        }
      }
    }
    this.c.globalAlpha = 1;
  }

  renderWaveFan() {
    if (!this.diffractionOrders || this.diffractionOrders.length === 0) return;
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
      
      // Draw rays to each order
      for (const order of this.diffractionOrders) {
        const x = Math.round(order.x);
        const v = order.intensity;
        if (v < 0.01) continue;
        
        // Draw a few pixels around the ray
        for (let dx = -2; dx <= 2; dx++) {
          const xPos = x + dx;
          if (xPos >= 0 && xPos < this.cvs.width) {
            ctx.globalAlpha = v * att * 0.8 * (1 - Math.abs(dx) / 3);
            ctx.fillStyle = this.color;
            ctx.fillRect(xPos, y, 1, 3);
          }
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Screen view shows discrete bright dots
  drawScreenView = (screenCtx, width, height) => {
    if (!this.diffractionOrders) {
      const spec = this.computeSpec();
      this.screenIntensity = this.fftToScreen(spec);
    }
    
    screenCtx.clearRect(0, 0, width, height);
    screenCtx.fillStyle = '#000000';
    screenCtx.fillRect(0, 0, width, height);
    
    // Draw each order as a bright vertical stripe
    for (const order of this.diffractionOrders) {
      const xScreen = (order.x / this.cvs.width) * width;
      const intensity = order.intensity;
      const spotWidth = Math.max(2, width * 0.015); // Responsive width
      
      for (let dx = -spotWidth; dx <= spotWidth; dx++) {
        const x = Math.round(xScreen + dx);
        if (x < 0 || x >= width) continue;
        
        const radialFade = 1 - Math.abs(dx) / spotWidth;
        const alpha = intensity * radialFade;
        
        const color = interpolate(0, this.color, alpha);
        screenCtx.fillStyle = color;
        screenCtx.fillRect(x, 0, 1, height);
      }
    }
  };

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
    const d = Math.max(1.0, Math.min(2.0, Number(distanceMeters)));
    this.distanceToScreen = d;
    this.redraw = true;
  };
}

export { GratingFFTSimulation };
