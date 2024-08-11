<canvas id="twoSourceInf"></canvas>

<div class="frequency">
    <input type="range" min="50" max="200" step="10" value="120" class="slider" id="wavelengthInput_2SF">
    Wavelength: <span id="wavelengthValue_2SF">120</span> px
</div>
<div class="amplitude">
    <input type="range" min="0.1" max="0.3" step="0.05" value="0.2" class="slider" id="amplitudeInput_2SF">
    Amplitude: <span id="amplitudeValue_2SF">0.2</span>
</div>
<input type="checkbox" id="lockScreen" checked="checked">
<label for="lockScreen">Lock Screen</label>
<input type="checkbox" id="lockPointer" checked="checked">
<label for="lockPointer">Lock Pointer</label>
<br>

Path Difference = <span id="pathDifference_2SF">0</span>λ
<br>
Phase Difference Δϕ = <span id="phaseDifference_2SF">0</span>π
<br>
<span id="interference_2SF">Constructive Interference!</span>

<script type="module" src="../javascript/sim2.js"></script>