class Simulation {
    constructor(cvs, c) {
        this.cvs = cvs;
        this.c = c;
        simulations.push(this);
    }
}

["mousedown", "touchstart"].forEach(event => {
    document.addEventListener(event, e => {
        for (let i = 0; i < simulations.length; i++) {
            const rect = simulations[i].cvs.getBoundingClientRect();
            if (event.pageX > rect.right || event.pageX < rect.left || event.pageY > rect.bottom || event.pageY < rect.top) continue;
            interacting = i;
        }
        if (interacting !== -1) simulations[interacting].mouseDown();
    });
});

["mouseup", "touchend"].forEach(event => {
    document.addEventListener(event, e => {
        if (interacting === -1) return;
        const rect = simulations[interacting].cvs.getBoundingClientRect();
        if (event.pageX > rect.right || event.pageX < rect.left || event.pageY > rect.bottom || event.pageY < rect.top) return;
        simulations[interacting].mouseUp()
        interacting = -1;
    });
});

document.addEventListener("mousemove", event => {
    if (interacting === -1) return;
    const rect = simulations[interacting].cvs.getBoundingClientRect();
    if (event.pageX > rect.right || event.pageX < rect.left || event.pageY > rect.bottom || event.pageY < rect.top) return;
    simulations[interacting].mouseMove(event, event.pageX, event.pageY);
});

document.addEventListener("touchmove", event => {
    if (interacting === -1) return;
    event.preventDefault();
    simulations[interacting].mouseMove(event, event.targetTouches[0].pageX, event.targetTouches[0].pageY);
});

const simulations = [];
let interacting = -1;

export { Simulation };