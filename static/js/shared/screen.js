import { SCREENS } from "./constants.js";

class Screen {
    constructor(cvs, c, x, y, h) {
        this.cvs = cvs;
        this.c = c;
        this.x = x;
        this.y = y;
        this.h = h;

        this.minX = 0.5 * cvs.width;
        this.maxX = 0.9 * cvs.width;
    }

    draw = () => {
        this.c.beginPath();
        this.c.strokeStyle = SCREENS.SCREEN_COLOR;
        this.c.lineWidth = SCREENS.SCREEN_WIDTH;
        this.c.moveTo(this.x, this.y - this.h / 2);
        this.c.lineTo(this.x, this.y + this.h / 2);
        this.c.closePath();
        this.c.stroke();
    }
}

export { Screen };