import { SCREENS } from "./constants.js";

class Screen {
    constructor(cvs, c, x, y, h) {
        this.cvs = cvs;
        this.c = c;
        this.x = x;
        this.y = y;
        this.h = h;

        this.minX = 0.3 * cvs.width;
        this.maxX = 0.85 * cvs.width;
    }

    draw = () => {
        this.c.beginPath();
        this.c.strokeStyle = SCREENS.COLOR;
        this.c.lineWidth = SCREENS.WIDTH;
        this.c.moveTo(this.x, this.y - this.h / 2);
        this.c.lineTo(this.x, this.y + this.h / 2);
        this.c.closePath();
        this.c.stroke();
    }
}

class HorizontalScreen {
    constructor(cvs, c, x, y, w) {
        this.cvs = cvs;
        this.c = c;
        this.x = x;
        this.y = y;
        this.w = w;

        this.minY = 0.25 * cvs.height;
        this.maxY = 0.70 * cvs.height;
    }

    draw = () => {
        this.c.beginPath();
        this.c.strokeStyle = SCREENS.COLOR;
        this.c.lineWidth = SCREENS.WIDTH;
        this.c.moveTo(this.x - this.w / 2, this.y);
        this.c.lineTo(this.x + this.w / 2, this.y);
        this.c.closePath();
        this.c.stroke();
    }
}

export { Screen, HorizontalScreen };