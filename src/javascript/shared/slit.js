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
      const c = this.c;
      const totalPatternWidth = this.slits * this.width + (this.slits - 1) * this.separation;
      const startX = this.x - totalPatternWidth / 2;

      c.strokeStyle = "#FFFFFF"; // white barrier line
      c.lineWidth = 2;

        // Draw line segments before, between, and after slits
      let currentX = this.x - this.w / 2;

      // Draw left segment before first slit
      if (startX > currentX) {
        c.beginPath();
        c.moveTo(currentX, this.y);
        c.lineTo(startX, this.y);
        c.stroke();
      }

      // Draw segments between slits
      for (let i = 0; i < this.slits; i++) {
        const slitStart = startX + i * (this.width + this.separation);
        const slitEnd = slitStart + this.width;

        // Draw line after this slit (except last one)
        if (i < this.slits - 1) {
          const nextSegmentStart = slitEnd;
          const nextSegmentEnd = slitEnd + this.separation;

          c.beginPath();
          c.moveTo(nextSegmentStart, this.y);
          c.lineTo(nextSegmentEnd, this.y);
          c.stroke();
        }
      }

      // Draw right segment after last slit
      const endX = this.x + this.w / 2;
      const lastSlitEnd = startX + (this.slits - 1) * (this.width + this.separation) + this.width;
      if (endX > lastSlitEnd) {
        c.beginPath();
        c.moveTo(lastSlitEnd, this.y);
        c.lineTo(endX, this.y);
        c.stroke();
      }
    };


}

export { Slit, DoubleSlit, NSlit };
