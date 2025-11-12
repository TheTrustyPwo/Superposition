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
        const ctx = this.c; // shorthand for readability
        ctx.beginPath();
        ctx.strokeStyle = SLITS.COLOR;
        ctx.lineWidth = SLITS.WIDTH;

        // Start drawing from the left edge of the full structure
        ctx.moveTo(this.x - this.w / 2, this.y);

        // Calculate the starting position for the first slit region (centered)
        let dist = this.x - ((this.slits - 1) * (this.width + this.separation)) / 2 - this.width / 2;

        // Draw the solid line up to the first slit
        ctx.lineTo(dist, this.y);

        // Loop through all slits
        for (let i = 0; i < this.slits; i++) {
            // Skip over the slit (gap)
            dist += this.width;
            ctx.moveTo(dist, this.y);

            // If this isn’t the last slit, draw the solid section between slits
            if (i < this.slits - 1) {
                dist += this.separation;
                ctx.lineTo(dist, this.y);
            }
        }

        // Draw the remaining right section of the barrier
        ctx.lineTo(this.x + this.w / 2, this.y);

        ctx.closePath();
        ctx.stroke();
    };

}

export { Slit, DoubleSlit, NSlit };
