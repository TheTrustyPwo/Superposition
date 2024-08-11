<canvas id="singleSlit"></canvas>

<div class="slitWidth">
    <input type="range" min="200" max="1000" step="100" value="500" class="slider" id="slitWidthInput_SS">
    Slit Width: <span id="slitWidthValue_SS">500</span> μm
</div>
<div class="wavelength">
    <input type="range" min="380" max="780" step="10" value="500" class="slider" id="wavelengthInput_SS">
    Wavelength: <span id="wavelengthValue_SS">500</span> nm
</div>

<script type="module" src="../javascript/sim4.js"></script>