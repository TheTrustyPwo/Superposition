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
    constructor(cvs, ctx, centerX, centerY, illuminatedWidthPx, densityPerMm, slitWidthMeters = 2e-6) {
        this.cvs = cvs;
        this.c = ctx;
        this.x = centerX;
        this.y = centerY;
        this.w = illuminatedWidthPx;
        this.density = densityPerMm;
        this.slitWidth = slitWidthMeters;
        this.MAX_DRAWN_SLITS = 600; // draw cap for performance/visibility
    }

    // center-to-center spacing in meters
    get spacingMeters() {
        return 1 / (this.density * 1e3);
    }

    // returns total theoretical slits across illuminated region given xpx2m mapping
    totalSlits(xpx2m) {
        const widthMeters = (this.w) * xpx2m;
        return Math.max(1, Math.floor(widthMeters / this.spacingMeters));
    }

    // draw the grating substrate and symbolic slits (ticks or small erased gaps)
    draw(xpx2m) {
        this.xpx2m = xpx2m;
        const ctx = this.c;
        const half = this.w / 2;
        const left = this.x - half;
        const right = this.x + half;

        // substrate
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = SLITS.COLOR;
        ctx.lineWidth = SLITS.WIDTH / 2;
        ctx.moveTo(left, this.y);
        ctx.lineTo(right, this.y);
        ctx.stroke();
        ctx.restore();

        // determine spacing in px and total slits
        const spacingPx = this.spacingMeters / xpx2m;
        const total = this.totalSlits(xpx2m);
        const step = Math.max(1, Math.floor(total / this.MAX_DRAWN_SLITS));
        const centerIndex = Math.floor(total / 2);
        const tickLen = 8;

        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = SLITS.COLOR;

        for (let i = 0; i < total; i += step) {
            const offset = i - centerIndex;
            const px = this.x + offset * spacingPx;
            if (px < left - 2 || px > right + 2) continue;

            if (spacingPx >= 6) {
                // small erased gap to look like a slit
                ctx.save();
                ctx.globalCompositeOperation = "destination-out";
                const gapW = Math.max(2, Math.round((this.slitWidth / xpx2m) * 0.6));
                ctx.fillStyle = "rgba(0,0,0,1)";
                ctx.fillRect(px - gapW/2, this.y - SLITS.WIDTH * 1.5, gapW, SLITS.WIDTH * 3);
                ctx.restore();
            } else {
                // small tick
                ctx.moveTo(px, this.y - tickLen);
                ctx.lineTo(px, this.y + tickLen);
            }
        }
        ctx.stroke();
    }

    // Build sampled aperture array (Float32Array) with given FFT size and xpx2m mapping.
    // aperture samples are in meters mapped to array indices: each sample corresponds to
    // dx = apertureWidthMeters / fftSize
    buildAperture(fftSize, xpx2m) {
        const N = fftSize;
        const aperture = new Float32Array(N);
        const apertureWidthMeters = this.w * xpx2m;
        const dx = apertureWidthMeters / N;
        const total = this.totalSlits(xpx2m);
        const centerIndex = Math.floor(total / 2);
        const spacing = this.spacingMeters;
        const slitHalf = this.slitWidth / 2;

        // center of aperture in meters relative to left edge
        const leftEdgeMeters = -apertureWidthMeters / 2;

        for (let i = 0; i < total; i++) {
            const offset = (i - centerIndex) * spacing;
            const slitCenterMeters = offset;
            // compute sample indices covering the slit
            const startMeters = slitCenterMeters - slitHalf;
            const endMeters = slitCenterMeters + slitHalf;

            // convert to sample indices
            const s = Math.floor((startMeters - leftEdgeMeters) / dx);
            const e = Math.ceil((endMeters - leftEdgeMeters) / dx);

            // clamp
            const si = Math.max(0, s);
            const ei = Math.min(N-1, e);

            for (let k = si; k <= ei; k++) aperture[k] = 1.0;
        }

        return aperture;
    }
}

export { Slit, DoubleSlit, Grating };
