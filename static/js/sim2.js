import { WaveDisplay } from "./shared/waves.js";

const cvs = document.querySelector('canvas');
const c = cvs.getContext('2d');

const s1 = new WaveDisplay(cvs, c);
const s2 = new WaveDisplay(cvs, c);
s1.load(100);
s2.load(100);