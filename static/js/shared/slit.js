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
        this.c.lineTo(this.x, this.y - this.width / 2 - this.separation / 2);
        this.c.moveTo(this.x, this.y - this.separation / 2);
        this.c.lineTo(this.x, this.y + this.separation / 2);
        this.c.moveTo(this.x, this.y + this.separation / 2 + this.width / 2);
        this.c.lineTo(this.x, this.y + this.h / 2);
        this.c.closePath();
        this.c.stroke();
    }
}

export { Slit, DoubleSlit };