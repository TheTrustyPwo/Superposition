import { Grating } from "../shared/slit.js";
import { i2h, interpolate, w2h } from "../utils/color.js";

// this is THE one 

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
    this.fftSize = 8192;
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
    const ordersToShow = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
    
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
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(this.cvs.width, screenY);
    ctx.stroke();
    ctx.restore();
    
    // Calculate maxHeight
    const maxHeight = this.cvs.height * 0.18;
    
    // Calculate envelope width factor based on distance
    const envelopeWidthFactor = 1.0 + (this.distanceToScreen - 1.0) * 0.4;
    const envelopeWidth = this.cvs.width * 0.3 * envelopeWidthFactor;
    
    // Single-slit diffraction envelope function with distinct lobes
    const singleSlitEnvelope = (x) => {
      const centerX = this.cvs.width / 2;
      const normalizedX = (x - centerX) / envelopeWidth;
      
      // Use sinc function to create proper zeros between lobes
      // sinc(x) = sin(πx)/(πx), and intensity is sinc²(x)
      const beta = normalizedX * 1.5; // Reduced from 1.8 to make lobes wider
      
      let sincValue;
      if (Math.abs(beta) < 0.001) {
        sincValue = 1; // Limit as beta approaches 0
      } else {
        sincValue = Math.sin(Math.PI * beta) / (Math.PI * beta);
      }
      
      // Square the sinc to get intensity, and scale to get proper side lobe heights
      let intensity = sincValue * sincValue;
      
      // Scale to make side lobes about 50% of main lobe
      // Natural sinc² gives ~4.5% for first side lobe, so we boost it
      if (Math.abs(beta) > 1.0 && Math.abs(beta) < 2.0) {
        // First side lobes
        intensity *= 11; // Boost to ~50%
      } else if (Math.abs(beta) >= 2.0 && Math.abs(beta) < 3.0) {
        // Second side lobes  
        intensity *= 8; // Boost to ~35%
      }
      
      return Math.max(0, intensity);
    };
    
    // Calculate peak heights based on new envelope with side lobes
    const peaks = this.diffractionOrders.map(order => {
      const envelopeIntensity = singleSlitEnvelope(order.x);
      return {
        x: order.x,
        height: envelopeIntensity * maxHeight * 0.98, // Scale to 98% to stay below envelope
        order: order.order,
        envelopeHeight: envelopeIntensity * maxHeight // Store full envelope height for comparison
      };
    });
    
    // Filter out peaks that are too small to see
    const visiblePeaks = peaks.filter(p => p.height > maxHeight * 0.01);
    
    // Sort peaks by x position
    visiblePeaks.sort((a, b) => a.x - b.x);
    
    // Draw wavy curve connecting all peaks
    ctx.lineWidth = 2;
    ctx.strokeStyle = i2h(this.color);
    ctx.fillStyle = i2h(this.color);
    
    // First pass: draw the curve, clamping to envelope
    ctx.beginPath();
    
    // Start from the left edge at baseline
    const leftmost = visiblePeaks[0];
    const startX = Math.max(0, leftmost.x - 100);
    ctx.moveTo(startX, screenY);
    
    // Helper function to clamp y value to envelope
    const clampToEnvelope = (x, y) => {
      const envelopeY = screenY - singleSlitEnvelope(x) * maxHeight;
      return Math.max(y, envelopeY); // Don't go above envelope (lower y = higher on screen)
    };
    
    // Draw smooth sinusoidal curve through each peak
    for (let i = 0; i < visiblePeaks.length; i++) {
      const currentPeak = visiblePeaks[i];
      const nextPeak = visiblePeaks[i + 1];
      
      if (i === 0) {
        // Calculate spacing for first peak
        const firstSpacing = nextPeak ? (nextPeak.x - currentPeak.x) : (currentPeak.x - startX);
        
        // Sharp rise approaching first peak - sample and clamp points along the curve
        const approachX = currentPeak.x - firstSpacing * 0.06;
        const numSamples = 20;
        
        for (let s = 0; s <= numSamples; s++) {
          const t = s / numSamples;
          const x = startX + t * (approachX - startX);
          
          // Bezier calculation
          const controlX1 = startX + (approachX - startX) * 0.7;
          const controlY1 = screenY;
          const controlX2 = approachX - (approachX - startX) * 0.1;
          const controlY2 = screenY - currentPeak.height * 0.85;
          
          const mt = 1 - t;
          const bx = mt*mt*mt*startX + 3*mt*mt*t*controlX1 + 3*mt*t*t*controlX2 + t*t*t*approachX;
          const by = mt*mt*mt*screenY + 3*mt*mt*t*controlY1 + 3*mt*t*t*controlY2 + t*t*t*(screenY - currentPeak.height * 0.95);
          
          const clampedY = clampToEnvelope(bx, by);
          if (s === 0) ctx.moveTo(bx, clampedY);
          else ctx.lineTo(bx, clampedY);
        }
        
        // Rounded peak top - sample and clamp
        const peakStartX = approachX;
        const peakEndX = currentPeak.x + firstSpacing * 0.06;
        
        for (let s = 0; s <= numSamples; s++) {
          const t = s / numSamples;
          const peakControlX1 = currentPeak.x - firstSpacing * 0.03;
          const peakControlY1 = screenY - currentPeak.height * 1.01;
          const peakControlX2 = currentPeak.x + firstSpacing * 0.03;
          const peakControlY2 = screenY - currentPeak.height * 1.01;
          
          const mt = 1 - t;
          const bx = mt*mt*mt*peakStartX + 3*mt*mt*t*peakControlX1 + 3*mt*t*t*peakControlX2 + t*t*t*peakEndX;
          const by = mt*mt*mt*(screenY - currentPeak.height * 0.95) + 3*mt*mt*t*peakControlY1 + 3*mt*t*t*peakControlY2 + t*t*t*(screenY - currentPeak.height * 0.95);
          
          const clampedY = clampToEnvelope(bx, by);
          ctx.lineTo(bx, clampedY);
        }
      }
      
      if (nextPeak) {
        const spacing = nextPeak.x - currentPeak.x;
        const midX = (currentPeak.x + nextPeak.x) / 2;
        const numSamples = 20;
        
        // Descent from peak
        const descentStartX = currentPeak.x + spacing * 0.06;
        for (let s = 0; s <= numSamples; s++) {
          const t = s / numSamples;
          const descendControlX1 = currentPeak.x + spacing * 0.22;
          const descendControlY1 = screenY - currentPeak.height * 0.7;
          const descendControlX2 = midX - spacing * 0.1;
          const descendControlY2 = screenY;
          
          const mt = 1 - t;
          const bx = mt*mt*mt*descentStartX + 3*mt*mt*t*descendControlX1 + 3*mt*t*t*descendControlX2 + t*t*t*midX;
          const by = mt*mt*mt*(screenY - currentPeak.height * 0.95) + 3*mt*mt*t*descendControlY1 + 3*mt*t*t*descendControlY2 + t*t*t*screenY;
          
          const clampedY = clampToEnvelope(bx, by);
          ctx.lineTo(bx, clampedY);
        }
        
        // Ascent approaching next peak
        const nextApproachX = nextPeak.x - spacing * 0.06;
        for (let s = 0; s <= numSamples; s++) {
          const t = s / numSamples;
          const ascentControlX1 = midX + spacing * 0.1;
          const ascentControlY1 = screenY;
          const ascentControlX2 = nextApproachX - spacing * 0.1;
          const ascentControlY2 = screenY - nextPeak.height * 0.85;
          
          const mt = 1 - t;
          const bx = mt*mt*mt*midX + 3*mt*mt*t*ascentControlX1 + 3*mt*t*t*ascentControlX2 + t*t*t*nextApproachX;
          const by = mt*mt*mt*screenY + 3*mt*mt*t*ascentControlY1 + 3*mt*t*t*ascentControlY2 + t*t*t*(screenY - nextPeak.height * 0.95);
          
          const clampedY = clampToEnvelope(bx, by);
          ctx.lineTo(bx, clampedY);
        }
        
        // Rounded peak top for next peak
        const nextPeakStartX = nextApproachX;
        const nextPeakEndX = nextPeak.x + spacing * 0.06;
        
        for (let s = 0; s <= numSamples; s++) {
          const t = s / numSamples;
          const nextPeakControlX1 = nextPeak.x - spacing * 0.03;
          const nextPeakControlY1 = screenY - nextPeak.height * 1.01;
          const nextPeakControlX2 = nextPeak.x + spacing * 0.03;
          const nextPeakControlY2 = screenY - nextPeak.height * 1.01;
          
          const mt = 1 - t;
          const bx = mt*mt*mt*nextPeakStartX + 3*mt*mt*t*nextPeakControlX1 + 3*mt*t*t*nextPeakControlX2 + t*t*t*nextPeakEndX;
          const by = mt*mt*mt*(screenY - nextPeak.height * 0.95) + 3*mt*mt*t*nextPeakControlY1 + 3*mt*t*t*nextPeakControlY2 + t*t*t*(screenY - nextPeak.height * 0.95);
          
          const clampedY = clampToEnvelope(bx, by);
          ctx.lineTo(bx, clampedY);
        }
      }
    }
    
    // Curve down from last peak to baseline
    const lastPeak = visiblePeaks[visiblePeaks.length - 1];
    const endX = Math.min(this.cvs.width, lastPeak.x + 100);
    const lastSpacing = endX - lastPeak.x;
    const numSamples = 20;
    
    const lastDescentStartX = lastPeak.x + lastSpacing * 0.06;
    for (let s = 0; s <= numSamples; s++) {
      const t = s / numSamples;
      const controlX1 = lastPeak.x + (endX - lastPeak.x) * 0.4;
      const controlY1 = screenY - lastPeak.height * 0.3;
      const controlX2 = endX - (endX - lastPeak.x) * 0.3;
      const controlY2 = screenY;
      
      const mt = 1 - t;
      const bx = mt*mt*mt*lastDescentStartX + 3*mt*mt*t*controlX1 + 3*mt*t*t*controlX2 + t*t*t*endX;
      const by = mt*mt*mt*(screenY - lastPeak.height * 0.95) + 3*mt*mt*t*controlY1 + 3*mt*t*t*controlY2 + t*t*t*screenY;
      
      const clampedY = clampToEnvelope(bx, by);
      ctx.lineTo(bx, clampedY);
    }
    
    // Complete the shape back to start
    ctx.lineTo(startX, screenY);
    ctx.closePath();
    
    // Fill with semi-transparent color
    ctx.globalAlpha = 0.3;
    ctx.fill();
    
    // Stroke the outline
    ctx.globalAlpha = 1.0;
    ctx.stroke();
    
    // Draw smooth dotted white envelope curve OVER the peaks showing side lobes
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.7;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    
    const centerX = this.cvs.width / 2;
    const numPoints = 400;
    let started = false;
    
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * this.cvs.width;
      const envelopeIntensity = singleSlitEnvelope(x);
      const y = screenY - envelopeIntensity * maxHeight;
      
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
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

  // Screen view shows discrete bright dots with width variation AND envelope-based intensity
  drawScreenView = (screenCtx, width, height) => {
    if (!this.diffractionOrders) {
      const spec = this.computeSpec();
      this.screenIntensity = this.fftToScreen(spec);
    }
    
    screenCtx.clearRect(0, 0, width, height);
    screenCtx.fillStyle = '#000000';
    screenCtx.fillRect(0, 0, width, height);
    
    // Calculate envelope width for intensity modulation
    const envelopeWidthFactor = 1.0 + (this.distanceToScreen - 1.0) * 0.4;
    const envelopeWidth = this.cvs.width * 0.3 * envelopeWidthFactor;
    
    // Single-slit envelope function (same as in drawIntensityPlot)
    const singleSlitEnvelope = (x) => {
      const centerX = this.cvs.width / 2;
      const normalizedX = (x - centerX) / envelopeWidth;
      const beta = normalizedX * 1.5;
      
      let sincValue;
      if (Math.abs(beta) < 0.001) {
        sincValue = 1;
      } else {
        sincValue = Math.sin(Math.PI * beta) / (Math.PI * beta);
      }
      
      let intensity = sincValue * sincValue;
      
      if (Math.abs(beta) > 1.0 && Math.abs(beta) < 2.0) {
        intensity *= 11;
      } else if (Math.abs(beta) >= 2.0 && Math.abs(beta) < 3.0) {
        intensity *= 8;
      }
      
      return Math.max(0, intensity);
    };
    
    // Draw each order as a bright vertical stripe with envelope-modulated intensity
    for (const order of this.diffractionOrders) {
      const xScreen = (order.x / this.cvs.width) * width;
      
      // Get envelope intensity at this position
      const envelopeIntensity = singleSlitEnvelope(order.x);
      
      // Combine order intensity with envelope intensity
      const combinedIntensity = envelopeIntensity;
      
      const spotWidth = Math.max(2, (order.width / this.cvs.width) * width * 2);
      
      for (let dx = -spotWidth; dx <= spotWidth; dx++) {
        const x = Math.round(xScreen + dx);
        if (x < 0 || x >= width) continue;
        
        const radialFade = 1 - Math.abs(dx) / spotWidth;
        const alpha = combinedIntensity * radialFade;
        
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
