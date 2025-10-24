import { Simulation } from "./index.js";
import { WaveVectorDisplay } from "../shared/waves.js";
import { Pointer } from "../shared/pointer.js";
import { Screen } from "../shared/screen.js";
import { distance } from "../utils/math.js";

// Double Source Interference Simulation
class InterferenceSimulation extends Simulation {
    constructor(cvs, c, wavelength = 120, amplitude = 0.2) {
        super(cvs, c);
        this.wavelength = wavelength;
        this.amplitude = amplitude;

        this.wave1 = new WaveVectorDisplay(cvs, c);
        this.wave2 = new WaveVectorDisplay(cvs, c);
        this.setWavelength(wavelength);
        this.setAmplitude(amplitude);

        this.resize();

        this.adjustingSource = 0;
        this.lockScreen = 1;
        this.lockPointer = 1;
        this.redraw = true;
    }

    resize = () => {
        super.resize();
        this.pointer = new Pointer(this.cvs, this.c, 0.85 * this.cvs.width + 10, this.cvs.height / 2);
        this.screen = new Screen(this.cvs, this.c, 0.85 * this.cvs.width, this.cvs.height / 2, this.cvs.height * 0.9);

        this.wave1.setRect(0.1 * this.cvs.width, 0.3 * this.cvs.height, this.pointer.x - 15, this.pointer.y);
        this.wave2.setRect(0.1 * this.cvs.width, 0.7 * this.cvs.height, this.pointer.x - 15, this.pointer.y);
        this.redraw = true;
    }

    update = () => {
        if (this.redraw) {
            this.c.clearRect(this.screen.x, 0, this.cvs.width, this.cvs.height);
            this.pointer.draw();
            this.screen.draw();
            this.plotIntensity();
            this.redraw = false;
        }

        this.wave1.setRect(this.wave1.x1, this.wave1.y1, this.pointer.x - 15, this.pointer.y);
        this.wave2.setRect(this.wave2.x1, this.wave2.y1, this.pointer.x - 15, this.pointer.y);
        this.wave1.update();
        this.wave2.update();
        this.wave1.drawWavelength(this.wave1.y1 <= this.wave2.y1);
        this.wave2.drawWavelength(this.wave1.y1 > this.wave2.y1);
    }

    plotIntensity = () => {
        this.c.beginPath();
        this.c.strokeStyle = "#d94444";
        this.c.lineWidth = 3;
        for (let y = 0; y <= this.cvs.height; y++) {
            const r1 = distance(this.wave1.x1, this.wave1.y1, this.screen.x, y);
            const r2 = distance(this.wave2.x1, this.wave2.y1, this.screen.x, y);
            const intensity =  50 * (Math.cos(Math.PI / this.wavelength * (r1 - r2))) ** 2;
            if (y === 0) this.c.moveTo(this.screen.x + 10 + intensity, y);
            else this.c.lineTo(this.screen.x + 10 + intensity, y);
        }
        this.c.stroke();
    }

    setWavelength = (wavelength) => {
        this.wavelength = wavelength;
        this.wave1.wavelength = wavelength;
        this.wave2.wavelength = wavelength;
        this.redraw = true;
    }

    setAmplitude = (amplitude) => {
        this.amplitude = amplitude;
        this.wave1.amplitude = amplitude;
        this.wave2.amplitude = amplitude;
        this.redraw = true;
    }

    get pathDifference() {
        return Math.abs(this.wave1.distance - this.wave2.distance) / this.wave1.wavelength;
    }

    get phaseDifference() {
        return 2 * this.pathDifference;
    }

    mouseDown = (event, x, y) => {
        if (this.wave1.source.contains(x, y)) this.adjustingSource = 1;
        else if (this.wave2.source.contains(x, y)) this.adjustingSource = 2;
        else this.adjustingSource = 0;
    };

    mouseUp = (event) => {
        this.adjustingSource = 0;
    };

    mouseMove = (event, x, y) => {
        if (this.adjustingSource === 0) {
            if (!this.lockPointer) {
                this.pointer.y = Math.max(Math.min(y, this.pointer.maxY), this.pointer.minY);
            }
            if (!this.lockScreen) {
                this.screen.x = Math.max(Math.min(x, this.screen.maxX), this.screen.minX);
                this.pointer.x = Math.max(Math.min(x, this.screen.maxX) + 10, this.screen.minX + 10);
            }
        } else {
            const wave = (this.adjustingSource === 1 ? this.wave1 : this.wave2);
            wave.x1 = Math.max(Math.min(x, 0.3 * this.cvs.width), 0.1 * this.cvs.width);
            wave.y1 = Math.max(Math.min(y, 0.9 * this.cvs.height), 0.1 * this.cvs.height);
        }
        this.redraw = true;
    }
}

export { InterferenceSimulation };