class WaveDisplay {
    constructor (cvs, c) {
        this.cvs = cvs;
        this.c = c;

        this.t = 0;
        this.dt = 0.01;
        this.frequency = 0.25;
        this.amplitude = 0.5;
        this.spacing = 10;

        this.vectors = [];
        this.setRect(0, this.cvs.height / 2, this.cvs.width, this.cvs.height / 2);
    }

    update = () => {
        this.vectors.forEach(v => v.draw());
        this.t += this.dt;
    }

    setRect = (x1, y1, x2, y2) => {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.gradient = (this.y2 - this.y1) / (this.x2 - this.x1);
        this.verticalOffset = this.y1 - this.gradient * this.x1;

        const distance = Math.sqrt((this.y2 - this.y1) ** 2 + (this.x2 - this.x1) ** 2);
        const amount = Math.ceil(distance / this.spacing);
        while (this.vectors.length > amount) this.vectors.pop();

        for (let i = 0; i < this.vectors.length; i++) {
            this.vectors[i].x = this.x1 + i * this.spacing;
            this.vectors[i].base = this.gradient * this.vectors[i].x + this.verticalOffset;
        }

        for (let i = this.vectors.length; i < amount; i++)
            this.vectors.push(new WaveVector(this, i));

        console.log(this.vectors.length);
    }

    set setFrequency(frequency) {
        this.frequency = frequency;
    }

    set setAmplitude(amplitude) {
        this.amplitude = amplitude;
    }

    set setSpacing(spacing) {
        this.spacing = spacing;
    }

    set setDt(dt) {
        this.dt = dt;
    }
}

class WaveVector {
    constructor(display, id) {
        this.display = display;
        this.id = id;
        this.x = this.display.x1 + this.id * this.display.spacing;
        this.base =  this.display.gradient * this.x + this.display.verticalOffset;
        this.y = 0.5 * this.display.amplitude * this.display.cvs.height
            * Math.sin(this.id * this.display.frequency) + this.base;
    }

    draw = () => {
        this.display.c.beginPath();
        this.display.c.moveTo(this.x, this.base);
        this.display.c.lineTo(this.x, this.y);
        this.display.c.closePath();
        this.display.c.strokeStyle = (this.y <= this.base ? "#000000" : "#454a4d")
        this.display.c.stroke();
        this.update();
    }

    update = () => {
        this.y = 0.5 * this.display.amplitude * this.display.cvs.height
            * Math.sin(this.id * this.display.frequency - this.display.t) + this.base;
    }
}

export { WaveDisplay, WaveVector };
