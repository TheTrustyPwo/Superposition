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
    constructor(cvs, c, x, y, h, width, separation, slits) {
        this.cvs = cvs;
        this.c = c;
        this.x = x;
        this.y = y;
        this.h = h;
        this.width = width;
        this.separation = separation;
        this.slits = slits;
    }

    draw = () => {
        this.c.beginPath();
        this.c.strokeStyle = SLITS.COLOR;
        this.c.lineWidth = SLITS.WIDTH;
        this.c.moveTo(this.x, this.y - this.h / 2);
        let dist = this.y - (this.slits * this.width) / 2 - ((this.slits - 1) * this.separation) / 2;
        this.c.lineTo(this.x, dist);
        for (let i = 1; i <= this.slits; i++) {
            dist += this.width;
            this.c.moveTo(this.x, dist);
            if (i < this.slits) {
                dist += this.separation;
                this.c.lineTo(this.x, dist);
            }
        }
        this.c.lineTo(this.x, this.y + this.h / 2);
        this.c.closePath();
        this.c.stroke();
    }
}

export { Slit, DoubleSlit, NSlit };