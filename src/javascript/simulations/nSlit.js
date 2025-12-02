import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

// ily please work

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
    // Calculate screen position based on distance
    // Distance: 1.0m (100cm) = halfway down (0.5), 2.0m (200cm) = quarter down (0.25)
    const screenYFraction = 0.5 - (this.distanceToScreen - 1.0) * 0.25;
    
    this.screen = {
      x: Math.round(this.cvs.width / 2),
      y: Math.round(screenYFraction * this.cvs.height),
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
  // Peak width depends on number of slits and distance
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
      // Spacing depends on wavelength: longer wavelength = wider spacing
      // Using 500nm as baseline wavelength
      const wavelengthFactor = this.wavelength / 500e-9;
      const baseSpacing = 120 * wavelengthFactor; // spacing scales with wavelength
      const xPos = this.cvs.width/2 + m * baseSpacing * (this.distanceToScreen / 1.5);
      
      // Calculate envelope intensity for this position - ALL orders touch envelope
      const centerX = this.cvs.width / 2;
      const dx = (xPos - centerX) / (this.cvs.width * 0.3);
      const envelopeIntensity = Math.exp(-dx * dx);
      
      // All orders match envelope height
      const intensity = envelopeIntensity;
      
      // Peak width depends on:
      // 1. Number of slits (more slits = narrower peaks) - increased sensitivity
      // 2. Distance (farther = wider peaks due to diffraction spreading) - increased sensitivity
      const effectiveSlits = this.illuminatedWidthPx / (1000 / this.density);
      const slitFactor = 50 / Math.sqrt(effectiveSlits); // Increased from 30 for more pronounced effect
      const distanceFactor = Math.pow(this.distanceToScreen / 1.0, 1.2); // Increased exponent and adjusted baseline for more visible change
      const peakWidth = Math.max(3, slitFactor * distanceFactor);
      
      if (xPos >= -50 && xPos < this.cvs.width + 50) {
        orders.push({ order: m, x: xPos, intensity: intensity, width: peakWidth });
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
    
    // Apply distance effect: farther = wider spacing (very subtle - only 10% range)
    // Scale from 1.0 to 2.0 meters -> factor from 0.95 to 1.05 (10% range)
    const distanceFactor = 0.95 + (this.distanceToScreen - 1.0) * 0.1;
    
    for (const order of this.diffractionOrders) {
      // Adjust position based on density and distance
      const adjustedX = this.cvs.width/2 + (order.x - this.cvs.width/2) * densityFactor * distanceFactor;
      
      const width = order.width; // Use calculated width based on number of slits
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
    
    // Draw horizontal screen line (thicker now for draggability)
    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4; // Increased from 2 to 4 for better visibility and dragging
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(this.cvs.width, screenY);
    ctx.stroke();
    ctx.restore();
    
    // Calculate maxHeight
    const maxHeight = this.cvs.height * 0.18;
    
    // Draw discrete peaks in wavelength color FIRST (so envelope goes over them)
    ctx.lineWidth = 3;
    ctx.strokeStyle = i2h(this.color);
    
    for (const order of this.diffractionOrders) {
      const x = order.x;
      
      // Calculate envelope intensity at this x position to match it exactly
      const centerX = this.cvs.width / 2;
      const dx = (x - centerX) / (this.cvs.width * 0.3);
      const envelopeIntensity = Math.exp(-dx * dx);
      
      // Use envelope intensity directly for height
      const h = envelopeIntensity * maxHeight;
      
      ctx.beginPath();
      ctx.moveTo(x, screenY);
      ctx.lineTo(x, screenY - h);
      ctx.stroke();
    }
    
    // Draw smooth dotted white envelope curve OVER the peaks
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.7;
    ctx.setLineDash([5, 5]); // Create dotted line
    
    ctx.beginPath();
    
    // Create smooth envelope curve that goes through each peak
    const centerX = this.cvs.width / 2;
    
    // Find the leftmost and rightmost orders to determine range
    const xPositions = this.diffractionOrders.map(o => o.x);
    const minX = Math.min(...xPositions);
    const maxX = Math.max(...xPositions);
    const range = maxX - minX;
    
    // Sample points along the width
    const numPoints = 200;
    let started = false;
    
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * this.cvs.width;
      
      // Calculate envelope intensity that passes through all peaks
      // Use a Gaussian-like envelope centered at middle
      const dx = (x - centerX) / (this.cvs.width * 0.3); // normalize by the actual spread of orders
      const envelopeIntensity = Math.exp(-dx * dx);
      
      const y = screenY - envelopeIntensity * maxHeight;
      
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    ctx.setLineDash([]); // Reset to solid line
    ctx.globalAlpha = 1;
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

    // Draw discrete bright spots with width based on number of slits
    for (const order of this.diffractionOrders) {
      const x = Math.round(order.x);
      const v = order.intensity;
      const h = Math.round(v * (this.cvs.height * 0.45));
      const width = Math.round(order.width); // Use calculated width
      
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
    // Lines removed - no visual connection between grating and maxima
  }

  // Screen view shows discrete bright dots with width variation
  drawScreenView = (screenCtx, width, height) => {
    if (!this.diffractionOrders) {
      const spec = this.computeSpec();
      this.screenIntensity = this.fftToScreen(spec);
    }
    
    screenCtx.clearRect(0, 0, width, height);
    screenCtx.fillStyle = '#000000';
    screenCtx.fillRect(0, 0, width, height);
    
    // Draw each order as a bright vertical stripe with variable width
    for (const order of this.diffractionOrders) {
      const xScreen = (order.x / this.cvs.width) * width;
      const intensity = order.intensity;
      const spotWidth = Math.max(2, (order.width / this.cvs.width) * width * 2); // Scale width to screen view
      
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
