Minima Condition: $b \sin(\theta) = m \lambda$

<div style="display: flex; flex-direction: row; align-items: flex-start; gap: 20px; margin-bottom: 20px;">
    <canvas id="singleSlit"></canvas>
    <canvas id="screen-view" width="40" height="400" style="border-left: 2px solid #ccc; background: black;"></canvas>
</div>

<div class="slitWidth">
    <input type="range" min="200" max="1000" step="100" value="500" class="slider" id="slitWidthInput_SS">
    Slit Width (b): <span id="slitWidthValue_SS">500</span> μm
</div>
<div class="wavelength">
    <input type="range" min="400" max="700" step="10" value="500" class="slider" id="wavelengthInput_SS">
    Wavelength (λ): <span id="wavelengthValue_SS">500</span> nm
</div>

Note: Intensity profile is normalized to the maximum intensity.

<script type="module" src="../javascript/sim4.js"></script>
