Diffraction Envelope Minima Condition: $b \sin(\theta) = m \lambda$

Maxima Condition: $d \sin(\theta) = n \lambda$

Number of Fringes in the Central Maximum of the Diffraction Envelope: $2 \left\lfloor \frac{d}{b} \right\rfloor + 1$

<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 20px;">
  <canvas id="screen-view" width="800" height="40" style="border-bottom: 2px solid #ccc; background: black;"></canvas>
  <canvas id="nSlit" width="800" height="400"></canvas>
</div>

<div class="slits">
    <input type="range" min="1" max="50" step="1" value="3" class="slider" id="slitsInput_nSlit">
    Slits: <span id="slitsValue_nSlit">3</span>
</div>
<div class="slitWidth">
    <input type="range" min="2" max="5" step="1" value="3" class="slider" id="slitWidthInput_nSlit">
    Slit Width (b): <span id="slitWidthValue_nSlit">3</span> μm
</div>
<div class="slitSeparation">
    <input type="range" min="6" max="10" step="1" value="8" class="slider" id="slitSeparationInput_nSlit">
    Slit Separation (d): <span id="slitSeparationValue_nSlit">8</span> μm
</div>
<div class="wavelength">
    <input type="range" min="400" max="700" step="10" value="500" class="slider" id="wavelengthInput_nSlit">
    Wavelength (λ): <span id="wavelengthValue_nSlit">500</span> nm
</div>
<div class="envelope">
    <input type="checkbox" id="envelopeInput_nSlit" checked="checked">
    <label for="envelopeInput_nSlit">Toggle Envelope</label>
</div>

Note: Intensity profile is normalized to the maximum intensity.

<script type="module" src="../javascript/sim6.js"></script>
