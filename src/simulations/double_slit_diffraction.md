Diffraction Envelope Minima Condition: $b \sin(\theta) = m \lambda$

Maxima Condition: $d \sin(\theta) = n \lambda$

Number of Fringes in the Central Maximum of the Diffraction Envelope: $2 \left\lfloor \frac{d}{b} \right\rfloor + 1$

<canvas id="doubleSlit"></canvas>

<div class="slitWidth">
    <input type="range" min="100" max="500" step="100" value="300" class="slider" id="slitWidthInput_DS">
    Slit Width (b): <span id="slitWidthValue_DS">300</span> μm
</div>
<div class="slitSeparation">
    <input type="range" min="600" max="1500" step="100" value="800" class="slider" id="slitSeparationInput_DS">
    Slit Separation (d): <span id="slitSeparationValue_DS">800</span> μm
</div>
<div class="wavelength">
    <input type="range" min="400" max="700" step="10" value="500" class="slider" id="wavelengthInput_DS">
    Wavelength (λ): <span id="wavelengthValue_DS">500</span> nm
</div>
<div class="envelope">
    <input type="checkbox" id="envelopeInput_DS" checked="checked">
    <label for="envelopeInput_DS">Toggle Envelope</label>
</div>

Note: Intensity profile is normalized to the maximum intensity.

<div align="center">
  <canvas id="screen-view" width="800" height="80"></canvas>
</div>


<script type="module" src="../javascript/sim5.js"></script>
