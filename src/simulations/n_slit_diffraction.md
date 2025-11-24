Diffraction Envelope Minima Condition: $b \sin(\theta) = m \lambda$

Maxima Condition: $d \sin(\theta) = n \lambda$

Number of Fringes in the Central Maximum of the Diffraction Envelope: $2 \left\lfloor \frac{d}{b} \right\rfloor + 1$

<!-- grating mode UI -->
<canvas id="screen-view" width="800" height="40" style="border-bottom: 2px solid #ccc; background: black;"></canvas>
<canvas id="nSlit" width="800" height="400"></canvas>

<div class="density">
    <input type="range" min="50" max="2000" step="10" value="600" class="slider" id="densityInput">
    Lines per mm: <span id="densityValue">600</span> lines/mm
</div>

<div class="wavelength">
    <input type="range" min="400" max="700" step="10" value="500" class="slider" id="wavelengthInput_nSlit">
    Wavelength (λ): <span id="wavelengthValue_nSlit">500</span> nm
</div>

<script type="module" src="../javascript/sim6.js"></script>

Note: Intensity profile is normalized to the maximum intensity.

<script type="module" src="../javascript/sim6.js"></script>
