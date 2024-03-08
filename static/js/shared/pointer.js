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

        this.c.fillStyle = "#179e7e"
        this.c.fill();
    }

    set setLength(length) {
        this.length = length;
    }
}

let dragging = -1;
const pointers = [];

function createPointer(pointer) {
    pointers.push(pointer);
}

document.addEventListener("mousedown", e => {
    for (let i = 0; i < pointers.length; i++) {
        // use math check in triangle
        // lazy to code
    }
    dragging = 0;
});

document.addEventListener("mouseup", e => { dragging = -1; });

document.addEventListener("mousemove", e => {
    if (dragging === -1) return;
    const pointer = pointers[dragging];
    pointer.y = Math.max(Math.min(pointer.y + e.movementY, pointer.maxY), pointer.minY);
    pointer.onMove();
});

export { Pointer, createPointer };