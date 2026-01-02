Diffraction Envelope Minima Condition: $b \sin(\theta) = m \lambda$

Maxima Condition: $d \sin(\theta) = n \lambda$

Number of Fringes in the Central Maximum of the Diffraction Envelope: $2 \left\lfloor \frac{d}{b} \right\rfloor + 1$

<!-- grating mode UI -->
<canvas id="screen-view" width="1000" height="40" style="border-bottom: 2px solid #ccc; background: black;"></canvas>
<canvas id="nSlit" width="1000" height="600"></canvas>

<div class="density">
    <input type="range" min="700" max="1400" step="10" value="1000" class="slider" id="densityInput">
    Lines per mm: <span id="densityValue">1000</span> lines/mm
</div>

<div class="wavelength">
    <input type="range" min="400" max="700" step="10" value="500" class="slider" id="wavelengthInput_nSlit">
    Wavelength (λ): <span id="wavelengthValue_nSlit">500</span> nm
</div>

<div class="distance">
    <input type="range" min="100" max="200" step="1" value="200" class="slider" id="distanceInput">
    Distance (cm): <span id="distanceValue">200</span> cm
</div>

<script type="module" src="../javascript/sim6.js"></script>

Note: Pattern is not to scale, maximas closer together so change is observable 
