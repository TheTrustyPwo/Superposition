const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');

const offsetX = cvs.offsetLeft;
const offsetY = cvs.offsetHeight / 2;

let t = 0;
let frequency = 0.05
let amplitude = 0.5;

class WaveVector {
    constructor(id) {
        this.id = id;
        this.x = offsetX + this.id * 10;
        this.y = 0.5 * amplitude * cvs.height * Math.sin(this.id * frequency) + offsetY;
    }

    draw = () => {
        c.beginPath();
        c.moveTo(this.x, offsetY);
        c.lineTo(this.x, this.y);
        c.closePath();
        c.stroke();
        this.update();
        console.log(this.id);
    }

    update = () => {
        this.y = 0.5 * amplitude * cvs.height * Math.sin(this.id * frequency - t) + offsetY;
    }
}

const vectorList = [];
for (let i = 0; i < 100; i++) {
    vectorList.push(new WaveVector(i));
}

function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    vectorList.forEach(v => v.draw());
    t += 0.01;
}

animate();