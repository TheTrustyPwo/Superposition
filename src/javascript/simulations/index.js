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
            simulations[interacting].mouseDown(e.clientX - rect.left, e.clientY - rect.top);
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
    simulations[interacting].mouseMove(e, e.clientX - rect.left, e.clientY - rect.top);
});

window.addEventListener("touchmove", e => {
    if (interacting === -1) return;
    e.preventDefault();
    const rect = simulations[interacting].cvs.getBoundingClientRect();
    if (e.targetTouches[0].clientX > rect.right || e.targetTouches[0].clientX < rect.left
        || e.targetTouches[0].clientY > rect.bottom || e.targetTouches[0].clientY < rect.top) return;
    simulations[interacting].mouseMove(e, e.targetTouches[0].clientX - rect.left, e.targetTouches[0].clientY - rect.top);
});

const simulations = [];
let interacting = -1;

export { Simulation };