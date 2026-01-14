import { POINTERS } from "./constants.js";

class Pointer {
    // This is an x coordinate restricted pointer
    constructor(cvs, c, x, y) {
        this.cvs = cvs;
        this.c = c;
        this.x = x;
        this.y = y;

        this.length = 40;
        this.minY = this.length;
        this.maxY = cvs.height - this.length;

        this.onMove = () => {};
    }

    draw = () => {
        this.c.beginPath();
        this.c.moveTo(this.x, this.y);
        this.c.lineTo(this.x + 0.866 * this.length, this.y + 0.5 * this.length);
        this.c.lineTo(this.x + 0.866 * this.length, this.y - 0.5 * this.length);
        this.c.lineTo(this.x, this.y);
        this.c.closePath();

        this.c.fillStyle = POINTERS.POINTER_COLOR;
        this.c.fill();
    }
}

export { Pointer };