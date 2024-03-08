class WaveDisplay {
    constructor (cvs, c, frequency = 0.5, amplitude = 0.25) {
        this.cvs = cvs;
        this.c = c;

        this.t = 0;
        this.frequency = frequency;
        this.amplitude = amplitude;
        this.spacing = 10;

        this.offsetX = this.cvs.offsetLeft;
        this.vectors = [];

        // Line
        this.gradient = -5;
        this.intercept = this.cvs.offsetHeight / 2 + 100;
    }

    load = (amount) => {
        for (let i = 0; i < amount; i++) this.vectors.push(new WaveVector(this, i));
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        this.c.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.vectors.forEach(v => v.draw());
        this.t += 0.01;
    }
}

class WaveVector {
    constructor(display, id) {
        this.display = display;
        this.id = id;
        this.base =  this.display.gradient * this.id + this.display.intercept;
        this.x = this.display.offsetX + this.id * this.display.spacing;
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
