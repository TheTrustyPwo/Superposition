import { Simulation } from "./index.js";
import { WaveVectorDisplay } from "../shared/waves.js";
import { Pointer } from "../shared/pointer.js";
import { Screen } from "../shared/screen.js";

// Double Source Interference Simulation
class InterferenceSimulation extends Simulation {
    constructor(cvs, c, frequency = 1.0, amplitude = 0.2) {
        super(cvs, c);
        this.frequency = frequency;
        this.amplitude = amplitude;

        this.wave1 = new WaveVectorDisplay(cvs, c);
        this.wave2 = new WaveVectorDisplay(cvs, c);
        this.setFrequency(frequency);
        this.setAmplitude(amplitude);

        this.pointer = new Pointer(cvs, c, cvs.width - 50, cvs.height / 2);
        this.screen = new Screen(cvs, c, cvs.width - 60, cvs.height / 2, cvs.height - 50);

        this.wave1.setRect(100, 0.3 * cvs.height, this.pointer.x - 20, this.pointer.y);
        this.wave2.setRect(100, 0.7 * cvs.height, this.pointer.x - 20, this.pointer.y);

        this.adjustingSource = 0;
    }

    update = () => {
        this.wave1.setRect(this.wave1.x1, this.wave1.y1, this.pointer.x - 20, this.pointer.y);
        this.wave2.setRect(this.wave2.x1, this.wave2.y1, this.pointer.x - 20, this.pointer.y);
        this.wave1.update();
        this.wave2.update();
        this.wave1.drawWavelength(this.wave1.y1 <= this.wave2.y1);
        this.wave2.drawWavelength(this.wave1.y1 > this.wave2.y1);

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

    mouseDown = (event) => {
        if (this.wave1.source.contains(event.pageX, event.pageY)) this.adjustingSource = 1;
        else if (this.wave2.source.contains(event.pageX, event.pageY)) this.adjustingSource = 2;
        else this.adjustingSource = 0;
    };

    mouseUp = (event) => {
        this.adjustingSource = 0;
    };

    mouseMove = (event, x, y) => {
        if (this.adjustingSource === 0) {
            this.pointer.y = Math.max(Math.min(y, this.pointer.maxY), this.pointer.minY);
            this.pointer.x = Math.max(Math.min(x, this.screen.maxX) + 10, this.screen.minX + 10);
            this.screen.x = Math.max(Math.min(x, this.screen.maxX), this.screen.minX);
        } else {
            const wave = (this.adjustingSource === 1 ? this.wave1 : this.wave2);
            wave.x1 = Math.max(Math.min(x, 0.3 * this.cvs.width), 100);
            wave.y1 = Math.max(Math.min(y, 0.9 * this.cvs.height), 0.1 * this.cvs.height);
        }
    }
}

export { InterferenceSimulation };