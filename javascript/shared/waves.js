import { distance } from "../utils/math.js";
import { WAVES } from "./constants.js";

class WaveVectorDisplay {
    constructor (cvs, c) {
        this.cvs = cvs;
        this.c = c;

        this.t = 0;
        this.dt = 1 / 60;
        this.wavelength = 150;
        this.amplitude = 0.2;
        this.velocity = 60;
        this.spacing = 10;

        this.vectors = [];
        this.source = new WaveSource(this);
        this.setRect(0, this.cvs.height / 2, this.cvs.width, this.cvs.height / 2);

        this.waveTopColor = WAVES.WAVES_TOP_COLOR;
        this.waveBottomColor = WAVES.WAVES_BOTTOM_COLOR;
    }

    update = () => {
        this.vectors.forEach(v => v.draw());
        this.source.draw();
        this.t += this.dt;
    }

    setRect = (x1, y1, x2, y2) => {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.gradient = (this.y2 - this.y1) / (this.x2 - this.x1);
        this.verticalOffset = this.y1 - this.gradient * this.x1;

        const amount = Math.ceil((x2 - x1) / this.spacing);
        while (this.vectors.length > amount) this.vectors.pop();

        for (let i = 0; i < this.vectors.length; i++) {
            this.vectors[i].x = this.x1 + i * this.spacing;
            this.vectors[i].base = this.gradient * this.vectors[i].x + this.verticalOffset;
        }

        for (let i = this.vectors.length; i < amount; i++)
            this.vectors.push(new WaveVector(this, i));
    }

    drawWavelength = (direction) => {
        let y1, y2, dist = distance(this.x1, this.y1, this.x2, this.y2);
        if (direction) {
            // On top
            y1 = this.x1 * this.gradient + this.verticalOffset - 0.5 * this.amplitude * this.cvs.height - 20;
            y2 = this.x2 * this.gradient + this.verticalOffset - 0.5 * this.amplitude * this.cvs.height - 20
        } else {
            // Below
            y1 = this.x1 * this.gradient + this.verticalOffset + 0.5 * this.amplitude * this.cvs.height + 20;
            y2 = this.x2 * this.gradient + this.verticalOffset + 0.5 * this.amplitude * this.cvs.height + 20
        }

        this.c.beginPath();
        this.c.moveTo(this.x1, y1);
        this.c.lineTo(this.x2, y2);

        const markerLength = 12;
        const theta = Math.atan(-1 / this.gradient);
        this.c.moveTo(this.x1 + markerLength * Math.cos(theta), y1 + markerLength * Math.sin(theta));
        this.c.lineTo(this.x1 - markerLength * Math.cos(theta), y1 - markerLength * Math.sin(theta))
        this.c.moveTo(this.x2 + markerLength * Math.cos(theta), y2 + markerLength * Math.sin(theta));
        this.c.lineTo(this.x2 - markerLength * Math.cos(theta), y2 - markerLength * Math.sin(theta))

        this.c.closePath();
        this.c.strokeStyle = WAVES.WAVELENGTH_DISPLAY_COLOR;
        this.c.lineWidth = WAVES.WAVELENGTH_DISPLAY_WIDTH;
        this.c.stroke();

        const textX = (this.x1 + this.x2) / 2;
        const textY = (y1 + y2) / 2 + (direction ? -1 : 1) * 18;
        this.c.save();
        this.c.font = "30px arial";
        this.c.textAlign = "center";
        this.c.fillStyle = WAVES.WAVELENGTH_DISPLAY_COLOR;
        this.c.translate(textX, textY);
        this.c.rotate(Math.atan(this.gradient));
        this.c.fillText(`${(dist / this.wavelength).toFixed(2)}λ`, 0, 10);
        this.c.restore();
    }

    get distance() {
        return distance(this.x1, this.y1, this.x2, this.y2);
    }

    get waveNumber() {
        return 2 * Math.PI / this.wavelength;
    }
}

class WaveVector {
    constructor(display, id) {
        this.display = display;
        this.id = id;

        this.x = this.display.x1 + this.id * this.display.spacing;
        this.base =  this.display.gradient * this.x + this.display.verticalOffset;
        const dist =  distance(this.x, this.base, this.display.x1, this.display.y1);
        this.y = 0.5 * this.display.amplitude * this.display.cvs.height
            * Math.cos(this.display.waveNumber * (dist - this.display.velocity * this.display.t)) + this.base;
    }

    draw = () => {
        this.display.c.beginPath();
        this.display.c.moveTo(this.x, this.base);
        this.display.c.lineTo(this.x, this.y);
        this.display.c.closePath();
        this.display.c.strokeStyle = (this.y <= this.base ? this.display.waveTopColor : this.display.waveBottomColor);
        this.display.c.lineWidth = WAVES.WAVES_WIDTH;
        this.display.c.stroke();
        this.update();
    }

    update = () => {
        const dist =  distance(this.x, this.base, this.display.x1, this.display.y1);
        this.y = 0.5 * this.display.amplitude * this.display.cvs.height
            * Math.cos(this.display.waveNumber * (dist - this.display.velocity * this.display.t)) + this.base;
    }
}

class WaveFrontDisplay {
    constructor(cvs, c) {
        this.cvs = cvs;
        this.c = c;

        this.t = 0;
        this.dt = 1 / 15
        this.frequency = 1.0;

        this.wavefronts = [];
        this.source = new WaveSource(this);
        this.setRect(0, this.cvs.height / 2, this.cvs.width, this.cvs.height / 2);

        this.wavefronts.push(new WaveFront(this, 1));
    }

    setRect = (x1, y1, x2, y2) => {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    update = () => {
        this.wavefronts.forEach(v => v.draw());
        this.t += this.dt;
    }
}

class WaveFront {
    constructor(display, id) {
        this.display = display;
        this.id = id;

        this.x = this.display.x1 + 100 * this.id / this.display.frequency;
    }

    draw = () => {
        this.display.c.beginPath();
        this.display.c.arc(this.display.x1, this.display.y1, this.x - this.display.x1, -Math.PI / 2, Math.PI / 2, false);
        this.display.c.closePath();
        this.display.c.strokeStyle = "#ffffff"
        this.display.c.stroke();
        console.log(this.display.x1, this.display.y1, this.x - this.display.x1)
        this.update();
    }

    update = () => {
 
    }
}

class WaveSource {
    constructor(display) {
        this.display = display;
        this.radius = 15;
        this.offset = 6;
        this.amplitude = 3;
    }

    update = () => {
        this.internal = this.offset + this.amplitude * Math.cos(this.display.waveNumber * this.display.velocity * this.display.t);
    }

    draw = () => {
        this.display.c.save();
        this.display.c.beginPath();
        this.display.c.arc(this.display.x1, this.display.y1, this.radius, 0, 2 * Math.PI, false);
        this.display.c.fillStyle = this.display.waveTopColor;
        this.display.c.closePath();
        this.display.c.fill();

        this.display.c.beginPath();
        this.display.c.arc(this.display.x1, this.display.y1, this.internal, 0, 2 * Math.PI, false);
        this.display.c.fillStyle = this.display.waveBottomColor;
        this.display.c.closePath();
        this.display.c.fill();
        this.display.c.restore();

        this.update();
    }

    contains = (x, y) => {
        return distance(x, y, this.display.x1, this.display.y1) <= this.radius;
    }
}

export { WaveVectorDisplay, WaveVector, WaveFrontDisplay };
