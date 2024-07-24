function h2r(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

function r2h(rgb) {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}

function interpolate(color1, color2, factor = 0.5) {
    color1 = h2r(color1); color2 = h2r(color2);
    let result = color1.slice();
    for (let i = 0; i < 3; i++)
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    return r2h(result);
}

function w2h(wavelength) {
    wavelength *= 1_000_000_000;
    let red, green, blue, factor;
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

    const gamma = 0.80;
    const R = Math.round(red > 0 ? 255 * Math.pow(red, gamma) : 0);
    const G = Math.round(green > 0 ? 255 * Math.pow(green, gamma) : 0);
    const B = Math.round(blue > 0 ? 255 * Math.pow(blue, gamma) : 0);
    return r2h([R, G, B]);
}

export { h2r, r2h, interpolate, w2h };