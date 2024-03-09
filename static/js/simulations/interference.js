import { Simulation } from "./index.js";
import { WaveDisplay } from "../shared/waves.js";
import { Pointer } from "../shared/pointer.js";
import { Screen } from "../shared/screen.js";

// Double Source Interference Simulation
class InterferenceSimulation extends Simulation {
    constructor(cvs, c, frequency = 1.0, amplitude = 0.2) {
        super(cvs, c);
        this.frequency = frequency;
        this.amplitude = amplitude;

        this.wave1 = new WaveDisplay(cvs, c);
        this.wave2 = new WaveDisplay(cvs, c);
        this.setFrequency(frequency);
        this.setAmplitude(amplitude);

        this.pointer = new Pointer(cvs, c, cvs.width - 50, cvs.height / 2);
        this.screen = new Screen(cvs, c, cvs.width - 60, cvs.height / 2, cvs.height - 50);

        this.wave1.setRect(100, 0.3 * cvs.height, this.pointer.x - 20, this.pointer.y);
        this.wave2.setRect(100, 0.7 * cvs.height, this.pointer.x - 20, this.pointer.y);
    }

    update = () => {
        this.wave1.setRect(100, 0.3 * this.cvs.height, this.pointer.x - 20, this.pointer.y);
        this.wave2.setRect(100, 0.7 * this.cvs.height, this.pointer.x - 20, this.pointer.y);
        this.wave1.update();
        this.wave2.update();
        this.wave1.drawWavelength(1);
        this.wave2.drawWavelength(0);

        this.pointer.draw();
        this.screen.draw();
    }

    setFrequency = (freq) => {
        this.frequency = freq;
        this.wave1.frequency = freq;
        this.wave2.frequency = freq;
    }

    setAmplitude = (amplitude) => {
        this.amplitude = amplitude;
        this.wave1.amplitude = amplitude;
        this.wave2.amplitude = amplitude;
    }

    get pathDifference() {
        return Math.abs(this.wave1.distance - this.wave2.distance) / this.wave1.wavelength;
    }

    get phaseDifference() {
        return 2 * this.pathDifference;
    }

    mouseDown = (event) => {};

    mouseUp = (event) => {};

    mouseMove = (event, x, y) => {
        event.preventDefault();
        this.pointer.y = Math.max(Math.min(y, this.pointer.maxY), this.pointer.minY);
        this.pointer.x = Math.max(Math.min(x, this.screen.maxX) + 10, this.screen.minX + 10);
        this.screen.x = Math.max(Math.min(x, this.screen.maxX), this.screen.minX);
    }
}

export { InterferenceSimulation };