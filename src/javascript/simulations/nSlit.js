import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

// version 50005

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
    this.setupDragHandlers();
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
    
    // Calculate envelope width factor based on distance
    // Physics: envelope width ∝ λL/a (wavelength × distance / slit width)
    // Farther distance → wider envelope (subtle but visible)
    // Scale from distance 1.0m to 2.0m → width factor from 1.0 to 1.4
    const envelopeWidthFactor = 1.0 + (this.distanceToScreen - 1.0) * 0.4;
    const envelopeWidth = this.cvs.width * 0.3 * envelopeWidthFactor;
    
    // Calculate peak heights based on envelope
    const peaks = this.diffractionOrders.map(order => {
      const dx = (order.x - this.cvs.width / 2) / envelopeWidth;
      const envelopeIntensity = Math.exp(-dx * dx);
      return {
        x: order.x,
        height: envelopeIntensity * maxHeight,
        order: order.order
      };
    });
    
    // Sort peaks by x position
    peaks.sort((a, b) => a.x - b.x);
    
    // Draw wavy curve connecting all peaks
    ctx.lineWidth = 2;
    ctx.strokeStyle = i2h(this.color);
    ctx.fillStyle = i2h(this.color);
    
    ctx.beginPath();
    
    // Start from the left edge at baseline
    const leftmost = peaks[0];
    const startX = Math.max(0, leftmost.x - 100);
    ctx.moveTo(startX, screenY);
    
    // Draw smooth sinusoidal curve through each peak
    for (let i = 0; i < peaks.length; i++) {
      const currentPeak = peaks[i];
      const nextPeak = peaks[i + 1];
      
      if (i === 0) {
        // Curve up to first peak with smooth sinusoidal shape
        const controlX1 = startX + (currentPeak.x - startX) * 0.33;
        const controlY1 = screenY - currentPeak.height * 0.05;
        const controlX2 = startX + (currentPeak.x - startX) * 0.67;
        const controlY2 = screenY - currentPeak.height * 0.95;
        ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, currentPeak.x, screenY - currentPeak.height);
      }
      
      if (nextPeak) {
        const midX = (currentPeak.x + nextPeak.x) / 2;
        const spacing = nextPeak.x - currentPeak.x;
        
        // Create extremely smooth rounded peak - control points extend far horizontally
        const peakControlX1 = currentPeak.x + spacing * 0.33;
        const peakControlY1 = screenY - currentPeak.height * 0.98;
        
        const peakControlX2 = currentPeak.x + spacing * 0.5;
        const peakControlY2 = screenY - currentPeak.height * 0.5;
        
        // Curve down from peak
        ctx.bezierCurveTo(peakControlX1, peakControlY1, peakControlX2, peakControlY2, midX, screenY);
        
        // Create extremely smooth rounded trough - control points extend far horizontally
        const troughControlX1 = midX + spacing * 0.17;
        const troughControlY1 = screenY * 1.0;
        
        const troughControlX2 = nextPeak.x - spacing * 0.33;
        const troughControlY2 = screenY - nextPeak.height * 0.05;
        
        // Curve up to next peak
        ctx.bezierCurveTo(troughControlX1, troughControlY1, troughControlX2, troughControlY2, nextPeak.x, screenY - nextPeak.height);
      }
    }
    
    // Curve down from last peak to baseline with rounded top
    const lastPeak = peaks[peaks.length - 1];
    const endX = Math.min(this.cvs.width, lastPeak.x + 100);
    const controlX1 = lastPeak.x + (endX - lastPeak.x) * 0.4;
    const controlY1 = screenY - lastPeak.height * 0.3;
    const controlX2 = endX - (endX - lastPeak.x) * 0.3;
    const controlY2 = screenY;
    ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, screenY);
    
    // Complete the shape back to start
    ctx.lineTo(startX, screenY);
    ctx.closePath();
    
    // Fill with semi-transparent color
    ctx.globalAlpha = 0.3;
    ctx.fill();
    
    // Stroke the outline
    ctx.globalAlpha = 1.0;
    ctx.stroke();
    
    // Draw smooth dotted white envelope curve OVER the peaks
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.7;
    ctx.setLineDash([5, 5]); // Create dotted line
    
    ctx.beginPath();
    
    // Create smooth envelope curve that goes through peak maxima
    const centerX = this.cvs.width / 2;
    
    // Sample points along the width
    const numPoints = 200;
    let started = false;
    
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * this.cvs.width;
      
      // Calculate envelope intensity using distance-dependent width
      const dx = (x - centerX) / envelopeWidth;
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

  setupDragHandlers = () => {
    // Set min and max Y bounds for the screen
    this.screen.minY = Math.round(this.cvs.height * 0.25); // 2.0m (farthest)
    this.screen.maxY = Math.round(this.cvs.height * 0.75); // 1.0m (closest)
  };

  mouseMove = (event, x, y) => {
    const prevY = this.screen.y;
    this.screen.y = Math.max(Math.min(y, this.screen.maxY), this.screen.minY);
    if (prevY === this.screen.y) return;
    
    // Update distance based on new Y position
    // Y from maxY (0.75*height) = 1.0m to minY (0.25*height) = 2.0m
    const fraction = (this.screen.maxY - this.screen.y) / (this.screen.maxY - this.screen.minY);
    this.distanceToScreen = 1.0 + fraction * 1.0;
    
    this.redraw = true;
  };
}

export { GratingFFTSimulation };
