import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

/*
  Modified to show discrete diffraction orders as dots of light
  - Intensity profile shows peaks for each order
  - Screen view shows bright spots instead of continuous distribution
*/

// claude my pookie

class GratingFFTSimulation {
  constructor(cvs, ctx, density = 1000, wavelength = 500e-9, slitWidth = 2e-6, distanceToScreen = 2.0) {
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

  // Calculate discrete diffraction orders using simplified approach
  // Always show at least 3 orders (center + first order on each side)
  calculateDiffractionOrders() {
    const d = 1e-3 / this.density; // grating spacing in meters
    const orders = [];
    
    // Fixed number of orders to always display
    const ordersToShow = [-3, -2, -1, 0, 1, 2, 3];
    
    for (const m of ordersToShow) {
      const sinTheta = m * this.wavelength / d;
      
      // Even if sinTheta > 1 (physically impossible), we'll place it for visibility
      let theta;
      if (Math.abs(sinTheta) <= 1) {
        theta = Math.asin(sinTheta);
      } else {
        // Extrapolate beyond physical limits for visualization
        theta = Math.sign(sinTheta) * Math.PI / 2 * Math.min(Math.abs(sinTheta), 3);
      }
      
      // Position on screen - scale to ensure visibility
      const baseSpacing = 120; // minimum pixels between orders
      const xPos = this.cvs.width/2 + m * baseSpacing * (this.distanceToScreen / 1.5);
      
      // Intensity envelope - gradually decrease with order
      const intensity = Math.exp(-Math.abs(m) * 0.3);
      
      if (xPos >= -50 && xPos < this.cvs.width + 50) {
        orders.push({ order: m, x: xPos, intensity: intensity });
      }
    }
    
    return orders;
  }

  fftToScreen(spec) {
    const N = spec.length;
    const screenIntensity = new Float32Array(this.cvs.width);
    screenIntensity.fill(0);

    // Use discrete orders with simplified positioning
    this.diffractionOrders = this.calculateDiffractionOrders();
    
    // Apply density effect: higher density = wider spacing
    const densityFactor = this.density / 700; // normalized to 700 lines/mm baseline
    
    // Apply distance effect: farther = wider spacing
    const distanceFactor = this.distanceToScreen / 1.5;
    
    for (const order of this.diffractionOrders) {
      // Adjust position based on density and distance
      const adjustedX = this.cvs.width/2 + (order.x - this.cvs.width/2) * densityFactor * distanceFactor;
      
      const width = 15; // Width of each peak in pixels
      for (let dx = -width*2; dx <= width*2; dx++) {
        const x = Math.round(adjustedX + dx);
        if (x >= 0 && x < this.cvs.width) {
          const gaussian = Math.exp(-(dx*dx) / (2 * width * width));
          screenIntensity[x] += order.intensity * gaussian;
        }
      }
    }

    // Store adjusted positions for rendering
    this.diffractionOrders = this.diffractionOrders.map(order => ({
      ...order,
      x: this.cvs.width/2 + (order.x - this.cvs.width/2) * densityFactor * distanceFactor
    }));

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
    const screenY = this.screen.y;
    
    // Draw horizontal screen line
    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(this.cvs.width, screenY);
    ctx.stroke();
    ctx.restore();
    
    // Draw white envelope curve
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.6;
    
    ctx.beginPath();
    for (let i = 0; i < this.diffractionOrders.length; i++) {
      const order = this.diffractionOrders[i];
      const x = order.x;
      const intensity = order.intensity;
      const y = screenY - intensity * (this.cvs.height * 0.18);
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Draw discrete peaks in color
    ctx.lineWidth = 3;
    ctx.strokeStyle = i2h(this.color);
    for (const order of this.diffractionOrders) {
      const x = order.x;
      const intensity = order.intensity;
      const h = intensity * (this.cvs.height * 0.18);
      
      ctx.beginPath();
      ctx.moveTo(x, screenY);
      ctx.lineTo(x, screenY - h);
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
    const screenY = this.screen.y;
    const gratingY = this.gratingY;
    const height = gratingY - screenY;
    if (height <= 0) return;

    // Draw wave rays from grating to each order on screen
    ctx.save();
    
    for (const order of this.diffractionOrders) {
      const targetX = order.x;
      const intensity = order.intensity;
      if (intensity < 0.05) continue;
      
      // Draw multiple rays to create wave-like appearance
      const numRays = 3;
      for (let r = 0; r < numRays; r++) {
        const offset = (r - 1) * 2; // spread rays slightly
        
        // Create gradient for the ray
        const gradient = ctx.createLinearGradient(
          this.gratingX,
          gratingY,
          targetX,
          screenY
        );
        gradient.addColorStop(0, this.color + '00'); // transparent at grating
        gradient.addColorStop(0.3, this.color + Math.floor(intensity * 100).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, this.color + Math.floor(intensity * 200).toString(16).padStart(2, '0'));
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 * intensity;
        
        ctx.beginPath();
        ctx.moveTo(this.gratingX + offset, gratingY);
        ctx.lineTo(targetX + offset, screenY);
        ctx.stroke();
      }
    }
    
    // Add dotted wave pattern along the rays
    const slices = 40;
    for (let s = 0; s < slices; s++) {
      const frac = s / (slices - 1);
      const y = Math.round(screenY + frac * height);
      const att = 0.8 - 0.6 * frac; // fade from screen to grating
      
      for (const order of this.diffractionOrders) {
        const targetX = order.x;
        const v = order.intensity;
        if (v < 0.05) continue;
        
        // Interpolate x position along the ray
        const x = Math.round(targetX + (this.gratingX - targetX) * frac);
        
        // Draw dots to create wave appearance
        for (let dx = -1; dx <= 1; dx++) {
          const xPos = x + dx;
          if (xPos >= 0 && xPos < this.cvs.width) {
            ctx.globalAlpha = v * att * 0.6;
            ctx.fillStyle = this.color;
            ctx.fillRect(xPos, y, 2, 2);
          }
        }
      }
    }
    
    ctx.restore();
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
    this.resize(); // Call resize to recalculate screen position
    this.redraw = true;
  };
}

export { GratingFFTSimulation };
