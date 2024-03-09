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
            // use math check in each simulation canvas
            // lazy to code
        }
        interacting = 0;
        simulations[interacting].mouseDown(event);
    });
});

["mouseup", "touchend"].forEach(event => {
    document.addEventListener(event, e => {
        if (interacting === -1) return;
        simulations[interacting].mouseUp(event)
        interacting = -1;
    });
});

document.addEventListener("mousemove", event => {
    if (interacting === -1) return;
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