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

export { h2r, r2h, interpolate };