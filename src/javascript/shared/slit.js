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

class NSlit {
    constructor(cvs, c, x, y, w, density) {
        this.cvs = cvs;
        this.c = c;
        this.x = x;          // center x of grating bar
        this.y = y;          // y position of grating bar
        this.w = w;          // width of illuminated region (fixed at half screen)
        this.density = density;  // lines per mm

        // conversions
        this.mm2px = 1 / 0.005;  // adjust if needed
    }

    // spacing between slits in pixels
    get spacingPx() {
        // density is lines per mm → spacing in mm = 1/density
        const spacingMm = 1 / this.density;
        return spacingMm * this.mm2px;
    }

    // number of slits that fit into the illuminated region
    get N() {
        return Math.floor(this.w / this.spacingPx);
    }

    draw = () => {
        const ctx = this.c;

        // Draw the main grating bar (half line thickness)
        ctx.beginPath();
        ctx.strokeStyle = SLITS.COLOR;
        ctx.lineWidth = SLITS.WIDTH / 2;

        ctx.moveTo(this.x - this.w / 2, this.y);
        ctx.lineTo(this.x + this.w / 2, this.y);
        ctx.stroke();

        // Draw slit tick marks
        const spacing = this.spacingPx;
        const half = this.w / 2;

        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = SLITS.COLOR;

        // center slit
        ctx.moveTo(this.x, this.y - 10);
        ctx.lineTo(this.x, this.y + 10);

        // left & right slits
        for (let i = 1; ; i++) {
            const dx = i * spacing;
            if (dx > half) break;

            // left slit
            ctx.moveTo(this.x - dx, this.y - 8);
            ctx.lineTo(this.x - dx, this.y + 8);

            // right slit
            ctx.moveTo(this.x + dx, this.y - 8);
            ctx.lineTo(this.x + dx, this.y + 8);
        }

        ctx.stroke();
    }
}

export { Slit, DoubleSlit, NSlit };
