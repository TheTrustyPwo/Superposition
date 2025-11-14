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
    constructor(cvs, c, x, y, w, width, separation, slits) {
        this.cvs = cvs;
        this.c = c;
        this.x = x;
        this.y = y;
        this.w = w;
        this.width = width;
        this.separation = separation;
        this.slits = slits;
    }

    draw = () => {
        const ctx = this.c;

        // Thin border line
        ctx.strokeStyle = SLITS.COLOR;
        ctx.lineWidth = SLITS.WIDTH / 2;
        ctx.beginPath();

        const cy = this.y;
        const cx = this.x;
        const half = this.w / 2;

        const slitWidth = this.width;        // actual gap width (px)
        const sep = this.separation;         // center-to-center spacing (px)

        const leftEdge = cx - half;
        const rightEdge = cx + half;

        // 1. Draw continuous line first
        ctx.moveTo(leftEdge, cy);
        ctx.lineTo(rightEdge, cy);
        ctx.stroke();

        // 2. Now ERASE GAPS (subtract slit regions)
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";  // erase mode
        ctx.fillStyle = "black";

        // ALWAYS DRAW THE CENTER SLIT
        ctx.fillRect(
            cx - slitWidth / 2,
            cy - SLITS.WIDTH,     // small thickness vertically
            slitWidth,
            SLITS.WIDTH * 2
        );

        // 3. Compute how many slits fit on each side
        const slitsPerSide = Math.floor(half / sep);

        // 4. Draw actual gaps left and right 
        for (let i = 1; i <= slitsPerSide; i++) {

            // Left slit
            const lx = cx - i * sep;
            ctx.fillRect(
                lx - slitWidth / 2,
                cy - SLITS.WIDTH,
                slitWidth,
                SLITS.WIDTH * 2
            );

            // Right slit
            const rx = cx + i * sep;
            ctx.fillRect(
                rx - slitWidth / 2,
                cy - SLITS.WIDTH,
                slitWidth,
                SLITS.WIDTH * 2
            );
        }

        ctx.restore();
    };

}

export { Slit, DoubleSlit, NSlit };
