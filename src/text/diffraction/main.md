# Diffraction
Diffraction is an old phenomenon that was first discovered in the 17th century. Are you ready to learn more about it? 

## History Of Diffraction: 
Diffraction was first observed by Francesco Grimaldi in the 17th century. He noted that light spreads out as it passes through small openings and around edges, a phenomenon he termed "diffraction."

### Key Historical Milestones

1. **Francesco Grimaldi (1665):** Observed diffraction patterns and introduced the term "diffraction."
2. **Isaac Newton (1670):** Proposed a particle theory of light, which could not fully explain diffraction.
3. **Thomas Young (1801):** Conducted the famous double-slit experiment, demonstrating that light behaves as a wave.
4. **Augustin-Jean Fresnel (1815):** Developed the wave theory of light further, providing a mathematical framework for diffraction.
5. **James Clerk Maxwell (1865):** Formulated Maxwell’s equations, which supported the wave theory of light.

## Applications Of Diffraction
Diffraction has wide-ranging applications across multiple fields:

### Optics

- **Diffraction Gratings:** Used to disperse light into its component colors for spectroscopy.
- **Microscopy:** High-resolution imaging in microscopes, such as electron microscopes, utilizes diffraction.

### Astronomy

- **Astronomical Observations:** Diffraction limits the resolution of telescopes, affecting how we view distant celestial objects.

### Material Science

- **X-ray Diffraction (XRD):** A technique used to determine the structure of crystalline materials by analyzing the pattern of X-rays diffracted by the material.

### Communication Technologies

- **Diffraction in Antennas:** Understanding diffraction helps design better antennas and improve signal transmission in various communication systems.

## Theory and Formulae

### Single Slit Diffraction

#### Minima (Dark Fringes)

The minima in a single-slit diffraction pattern occur at angles where destructive interference causes the light intensity to drop to zero. The condition for the minima is given by:

$$
a \sin(\theta) = m \lambda
$$

where:

- a is the slit width,
- $\theta$ is the angle of diffraction,
- m is the order of the minima (an integer, $m = \pm1, \pm2, \pm3, \dots$),
- $\lambda$ is the wavelength of the incident light.

#### Maxima (Bright Fringes)

The central maximum is the brightest point and occurs at \(\theta = 0\). The positions of secondary maxima (less bright than the central maximum) are not as straightforward to calculate analytically. However, they occur between the minima and can be found using more detailed analysis or approximation methods.

**SIMULATION**
<canvas></canvas>

<div class="slitWidth">
    <input type="range" min="200" max="1000" step="100" value="500" class="slider" id="slitWidthInput">
    Slit Width: <span id="slitWidthValue">500</span> μm
</div>
<div class="wavelength">
    <input type="range" min="380" max="780" step="10" value="500" class="slider" id="wavelengthInput">
    Wavelength: <span id="wavelengthValue">500</span> nm
</div>

<script type="module" src="../javascript/sim4.js"></script>


### Diffraction Grating

When light encounters the grating, each slit or groove in the grating acts as a source of light waves. These waves interfere with each other, creating a pattern of bright and dark regions known as a diffraction pattern. The bright regions (maxima) occur where the waves from different slits constructively interfere.

The diffraction angle for a grating is determined by:

$$
d \sin(\theta) = n \lambda
$$

where:

 - d is the grating spacing,
 - $\theta$ is the diffraction angle, 
 - n is the order of the maximum, (n = 0, 1, 2, 3, ...)
 - $\lambda$ is the wavelength of light.

**SIMULATION**
<canvas></canvas>

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


### Resolving Power and Rayleigh's Criterion

The resolving power of an optical instrument, such as a telescope or microscope, refers to its ability to distinguish between two close objects. 

The Rayleigh criterion states that two images are just resolved or distinguishable when the central maximum of one image coincides with the first minimum of the other image.

Two images are just resolved when angular separation between the two sources, $\alpha$ is $\approx$ angular separation, $\theta_{\text{min}}$ 

Therefore Rayleigh criterion for resolving power of a single aperture is:

$$\theta_{\text{min}} \approx \frac{\lambda}{b}$$

where:

 - b is the slit width,
 - $\theta_{\text{min}}$ is angular separation in radians, 
 - $\lambda$ is the wavelength of light.

## Key Formulae Summary

Here is a summary of the key formulae related to diffraction:

- **Single-Slit Diffraction Minima:**

  $$
  a \sin(\theta) = m \lambda
  $$

- **Diffraction Grating Equation:**

  $$
  d \sin(\theta) = m \lambda
  $$

- **Rayleigh's Criterion:**

  $$\theta_{\text{min}} \approx \frac{\lambda}{b}$$

## Enrichment

### Intensity Profile

The intensity profile for diffraction patterns, such as those observed in single-slit and double-slit experiments, shows the variation of light intensity as a function of angle. The central maximum is the brightest, and the intensity decreases for subsequent maxima.

For a single slit, the intensity profile is described by:

$$
I(\theta) = I_0 \left(\frac{\sin(\beta)}{\beta}\right)^2
$$

The resulting pattern consists of a central bright fringe, with dimmer fringes on either side.


### Rayleigh criterion for circular aperture
$$
\theta_R = 1.22 \frac{\lambda}{D}
$$

where $\theta_R$ is the angular resolution, $\lambda$ is the wavelength of light, and D is the diameter of the aperture.
