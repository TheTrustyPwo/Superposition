<canvas id="nSlit"></canvas>

<div class="slits">
    <input type="range" min="1" max="50" step="1" value="3" class="slider" id="slitsInput_nSlit">
    Slits: <span id="slitsValue_nSlit">3</span>
</div>
<div class="slitWidth">
    <input type="range" min="1" max="10" step="1" value="5" class="slider" id="slitWidthInput_nSlit">
    Slit Width: <span id="slitWidthValue_nSlit">5</span> μm
</div>
<div class="slitSeparation">
    <input type="range" min="1" max="10" step="1" value="5" class="slider" id="slitSeparationInput_nSlit">
    Slit Separation: <span id="slitSeparationValue_nSlit">5</span> μm
</div>
<div class="wavelength">
    <input type="range" min="380" max="780" step="10" value="500" class="slider" id="wavelengthInput_nSlit">
    Wavelength: <span id="wavelengthValue_nSlit">500</span> nm
</div>
<div class="envelope">
    <input type="checkbox" id="envelopeInput_nSlit" checked="checked">
    <label for="envelopeInput_nSlit">Toggle Envelope</label>
</div>

<script type="module" src="../javascript/sim6.js"></script>