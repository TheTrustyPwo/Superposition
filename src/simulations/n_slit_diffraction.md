<canvas id="nSlit"></canvas>

<div class="slits">
    <input type="range" min="1" max="100" step="1" value="3" class="slider" id="slitsInput">
    Slits: <span id="slitsValue">3</span>
</div>
<div class="slitWidth">
    <input type="range" min="1" max="10" step="1" value="5" class="slider" id="slitWidthInput">
    Slit Width: <span id="slitWidthValue">5</span> μm
</div>
<div class="slitSeparation">
    <input type="range" min="1" max="10" step="1" value="5" class="slider" id="slitSeparationInput">
    Slit Separation: <span id="slitSeparationValue">5</span> μm
</div>
<div class="wavelength">
    <input type="range" min="380" max="780" step="10" value="500" class="slider" id="wavelengthInput">
    Wavelength: <span id="wavelengthValue">500</span> nm
</div>

<script type="module" src="../javascript/sim6.js"></script>