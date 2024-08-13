<canvas id="doubleSlit"></canvas>

<div class="slitWidth">
    <input type="range" min="200" max="1000" step="100" value="500" class="slider" id="slitWidthInput_DS">
    Slit Width: <span id="slitWidthValue_DS">500</span> μm
</div>
<div class="slitSeparation">
    <input type="range" min="200" max="1000" step="100" value="500" class="slider" id="slitSeparationInput_DS">
    Slit Separation: <span id="slitSeparationValue_DS">500</span> μm
</div>
<div class="wavelength">
    <input type="range" min="380" max="780" step="10" value="500" class="slider" id="wavelengthInput_DS">
    Wavelength: <span id="wavelengthValue_DS">500</span> nm
</div>

<script type="module" src="../javascript/sim5.js"></script>