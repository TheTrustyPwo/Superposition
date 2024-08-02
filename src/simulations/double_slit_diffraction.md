<canvas id="doubleSlit"></canvas>

<div class="slitWidth">
    <input type="range" min="200" max="1000" step="100" value="500" class="slider" id="slitWidthInput">
    Slit Width: <span id="slitWidthValue">500</span> μm
</div>
<div class="slitSeparation">
    <input type="range" min="200" max="1000" step="100" value="500" class="slider" id="slitSeparationInput">
    Slit Separation: <span id="slitSeparationValue">500</span> μm
</div>
<div class="wavelength">
    <input type="range" min="380" max="780" step="10" value="500" class="slider" id="wavelengthInput">
    Wavelength: <span id="wavelengthValue">500</span> nm
</div>

<script type="module" src="../javascript/sim5.js"></script>