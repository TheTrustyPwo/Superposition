import { SLITS } from "./constants.js";

class Slit {
    constructor(cvs, c, x, y, h, width) {
        this.cvs = cvs;
        this.c = c;
        this.x = x;
        this.y = y;
        this.h = h;
        this.width = width;
    }

    draw = () => {
        this.c.beginPath();
        this.c.strokeStyle = SLITS.COLOR;
        this.c.lineWidth = SLITS.WIDTH;
        this.c.moveTo(this.x, this.y - this.h / 2);
        this.c.lineTo(this.x, this.y - this.width / 2);
        this.c.moveTo(this.x, this.y + this.h / 2);
        this.c.lineTo(this.x, this.y + this.width / 2);
        this.c.closePath();
        this.c.stroke();
    }
}

class DoubleSlit {
    constructor(cvs, c, x, y, h, width, separation) {
        this.cvs = cvs;
        this.c = c;
        this.x = x;
        this.y = y;
        this.h = h;
        this.width = width;
        this.separation = separation;
    }

    draw = () => {
        this.c.beginPath();
        this.c.strokeStyle = SLITS.COLOR;
        this.c.lineWidth = SLITS.WIDTH;
        this.c.moveTo(this.x, this.y - this.h / 2);
        this.c.lineTo(this.x, this.y - this.width - this.separation / 2);
        this.c.moveTo(this.x, this.y - this.separation / 2);
        this.c.lineTo(this.x, this.y + this.separation / 2);
        this.c.moveTo(this.x, this.y + this.separation / 2 + this.width);
        this.c.lineTo(this.x, this.y + this.h / 2);
        this.c.closePath();
        this.c.stroke();
    }
}

class Grating {
    /**
     * @param cvs Canvas element
     * @param c   CanvasRenderingContext2D
     * @param x   center x (px)
     * @param y   grating y (px)
     * @param w   illuminated width (px)  -- we set this to half canvas width from simulation
     * @param density lines per mm (number)
     */
    constructor(cvs, c, x, y, w, density = 600) {
        this.cvs = cvs;
        this.c = c;
        this.x = x;
        this.y = y;
        this.w = w;
        this.density = density; // lines per mm

        // visual limits for drawing (symbolic drawing)
        this.MAX_DRAWN_SLITS = 300;
    }

    // spacing in meters (center-to-center)
    get spacingMeters() {
        return 1 / (this.density * 1e3);
    }

    // spacing in pixels using simulation's xpx2m mapping (must be set by simulation when constructed)
    // If simulation doesn't set xpx2m on this object, default fallback below will be used.
    get spacingPx() {
        const xpx2m = this.xpx2m ?? (5 / 1_000_0); // fallback if not provided
        return this.spacingMeters / xpx2m;
    }

    // total theoretical slits across the illuminated width (may be large)
    totalSlits(xpx2m) {
        const widthMeters = (this.w) * (xpx2m);
        return Math.max(1, Math.floor(widthMeters / this.spacingMeters));
    }

    /**
     * Draws the substrate line and symbolic slits:
     * - draws only up to MAX_DRAWN_SLITS tick or short-gap representations
     * - uses step to select which physical slits to draw, so positions stay physically correct
     *
     * @param {number} xpx2m mapping px -> m used by simulation
     */
    draw = (xpx2m) => {
        const ctx = this.c;
        this.xpx2m = xpx2m; // store for spacingPx getter

        const half = this.w / 2;
        const left = this.x - half;
        const right = this.x + half;

        // 1) Draw substrate line (half thickness for requested style)
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = SLITS.COLOR;
        ctx.lineWidth = SLITS.WIDTH / 2;
        ctx.moveTo(left, this.y);
        ctx.lineTo(right, this.y);
        ctx.stroke();
        ctx.restore();

        // 2) Compute theoretical counts and sampling for drawing
        const total = this.totalSlits(xpx2m);

        // Compute actual spacing in px (may be fractional)
        const spacingPx = this.spacingMeters / xpx2m;

        // If spacing is extremely small, we'll still draw at most MAX_DRAWN_SLITS by sampling
        const step = Math.max(1, Math.floor(total / this.MAX_DRAWN_SLITS));

        // Compute index of the center slit (we place slits centered in the illuminated region)
        // Approach: compute the index 0..total-1 where center is nearest; then position each slit at:
        // left + (i + 0.5) * spacingPxScaled where spacingPxScaled = spacing in px
        // But simpler: compute center position as this.x and calculate positions relative to center index.
        const centerIndex = Math.floor(total / 2);

        // 3) Draw symbolic slits (small gaps or tick marks) for every 'step'th slit
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = SLITS.COLOR;

        // Visual half-length of tick marks
        const tickLen = 8;

        for (let i = 0; i < total; i += step) {
            // compute offset from center (in slits)
            const offset = i - centerIndex;
            const px = this.x + offset * spacingPx;

            // Only draw if the px lies within left..right
            if (px < left - 1 || px > right + 1) continue;

            // If spacingPx >= ~4px, draw a short actual gap (erase a tiny rectangle)
            if (spacingPx >= 6) {
                // small visual gap (erase mode) to look like a slit
                ctx.save();
                ctx.globalCompositeOperation = "destination-out";
                // make gap height proportional to substrate thickness (a modest vertical rectangle)
                ctx.fillStyle = "rgba(0,0,0,1)";
                ctx.fillRect(px - Math.max(1, Math.floor(spacingPx * 0.15)), this.y - SLITS.WIDTH * 1.5, Math.max(2, Math.floor(spacingPx * 0.3)), SLITS.WIDTH * 3);
                ctx.restore();
            } else {
                // spacing small - draw a tick mark
                ctx.moveTo(px, this.y - tickLen);
                ctx.lineTo(px, this.y + tickLen);
            }
        }

        ctx.stroke();
    }
}

export { Slit, DoubleSlit, Grating };
