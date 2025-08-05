class Simulation {
    constructor(cvs, c) {
        this.cvs = cvs;
        this.c = c;
        simulations.push(this);
    }

    resize() {
        const clientWidth = document.querySelector(".md-content").clientWidth;
        this.cvs.width = Math.min(1000, clientWidth * 2);
        this.cvs.height = this.cvs.width / 2;
        this.scale = this.cvs.width / clientWidth;
    }

    mouseDown() {

    }

    mouseMove(event, x, y) {

    }
}

["resize", "orientationchange"].forEach(event => {
    window.addEventListener(event, e => {
        for (let i = 0; i < simulations.length; i++) {
            simulations[i].resize();
        }
    });
});

["mousedown", "touchstart"].forEach(event => {
    window.addEventListener(event, e => {
        for (let i = 0; i < simulations.length; i++) {
            const rect = simulations[i].cvs.getBoundingClientRect();
            if (e.clientX > rect.right || e.clientX < rect.left || e.clientY > rect.bottom || e.clientY < rect.top) continue;
            interacting = i;
            const scale = simulations[interacting].scale;
            simulations[interacting].mouseDown(scale * (e.clientX - rect.left), scale * (e.clientY - rect.top));
        }
    });
});

["mouseup", "touchend"].forEach(event => {
    window.addEventListener(event, e => {
        if (interacting === -1) return;
        const rect = simulations[interacting].cvs.getBoundingClientRect();
        if (e.clientX > rect.right || e.clientX < rect.left || e.clientY > rect.bottom || e.clientY < rect.top) return;
        simulations[interacting].mouseUp()
        interacting = -1;
    });
});

window.addEventListener("mousemove", e => {
    if (interacting === -1) return;
    const rect = simulations[interacting].cvs.getBoundingClientRect();
    if (e.clientX > rect.right || e.clientX < rect.left || e.clientY > rect.bottom || e.clientY < rect.top) return;
    if (e.cancelable) e.preventDefault();
    const scale = simulations[interacting].scale;
    simulations[interacting].mouseMove(e, scale * (e.clientX - rect.left), scale * (e.clientY - rect.top));
}, { passive: false });

window.addEventListener("touchmove", e => {
    if (interacting === -1) return;
    const rect = simulations[interacting].cvs.getBoundingClientRect();
    if (e.targetTouches[0].clientX > rect.right || e.targetTouches[0].clientX < rect.left
        || e.targetTouches[0].clientY > rect.bottom || e.targetTouches[0].clientY < rect.top) {
        return;
    }
    if (e.cancelable) e.preventDefault();
    const scale = simulations[interacting].scale;
    simulations[interacting].mouseMove(e, scale * (e.targetTouches[0].clientX - rect.left), scale * (e.targetTouches[0].clientY - rect.top));
}, { passive: false });

const simulations = [];
let interacting = -1;

export { Simulation };