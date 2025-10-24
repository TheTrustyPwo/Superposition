function h2r(hex) {
    hex = hex.replace(/^#/, '');

    // Parse the hex string into its red, green, and blue components
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return [r, g, b];
}

function i2h(value) {
    return "#" + ((1 << 24) + value).toString(16).slice(1);
}

function rgbToInt(r, g, b) {
    return (r << 16) + (g << 8) + b;
}

function intToRgb(value) {
    const r = (value >> 16) & 0xFF;
    const g = (value >> 8) & 0xFF;
    const b = value & 0xFF;
    return [r, g, b];
}

function interpolate(color1, color2, t) {
    const [r1, g1, b1] = intToRgb(color1);
    const [r2, g2, b2] = intToRgb(color2);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `rgb(${r}, ${g}, ${b})`;
}

function w2h(wavelength) {
    wavelength *= 1_000_000_000;
    let red, green, blue;
    if (wavelength >= 380 && wavelength < 440) {
        red   = -(wavelength - 440) / (440 - 380);
        green = 0.0;
        blue  = 1.0;
    } else if (wavelength >= 440 && wavelength < 490) {
        red   = 0.0;
        green = (wavelength - 440) / (490 - 440);
        blue  = 1.0;
    } else if (wavelength >= 490 && wavelength < 510) {
        red   = 0.0;
        green = 1.0;
        blue  = -(wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
        red   = (wavelength - 510) / (580 - 510);
        green = 1.0;
        blue  = 0.0;
    } else if (wavelength >= 580 && wavelength < 645) {
        red   = 1.0;
        green = -(wavelength - 645) / (645 - 580);
        blue  = 0.0;
    } else if (wavelength >= 645 && wavelength < 781) {
        red   = 1.0;
        green = 0.0;
        blue  = 0.0;
    } else {
        red   = 0.0;
        green = 0.0;
        blue  = 0.0;
    }

    const R = Math.round(255 * red), G= Math.round(255 * green), B = Math.round(255 * blue);
    return rgbToInt(R, G, B);
}

export { i2h, intToRgb, rgbToInt, interpolate, w2h };