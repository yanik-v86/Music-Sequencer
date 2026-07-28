# Implementation Plan: Realistic Sounds & Enhanced UX for Sequencer

This plan aims to overhaul the Web Audio API synthesis engine to make all instruments (melody, bass, and percussion) sound significantly more natural and realistic. Additionally, we will introduce a global reverb/delay effects send system and a real-time glowing oscilloscope visualizer to elevate the user experience.

---

## Proposed Changes

### Component 1: Upgraded Sound Engine (`script.js`)

We will replace the simple raw oscillators with custom-built physical modeling, frequency modulation (FM), additive synthesis, and resonant filter-envelope synthesizer voices. 

#### 1. Melody Synthesis Upgrades
The existing wave types will map to new synthesis models:
- **`sine` (FM Piano/Bell)**: Two-operator FM synth. A carrier sine wave modulated by another sine wave. It uses a decay envelope on both modulation index (timbre) and gain to simulate an organic electric piano or metallic chime.
- **`triangle` (Plucked String)**: A Karplus-Strong physical modeling algorithm. We inject a tiny burst of white noise into a feedback delay loop with a low-pass filter. This simulates string vibrations, where high frequencies decay faster and higher pitches have naturally shorter decay times.
- **`sawtooth` (Analog Synth Lead)**: A dual detuned sawtooth synth running through a resonant low-pass filter with an exponential sweep envelope. This sounds thick and lush (like a classic polyphonic synthesizer pad or lead) rather than sharp and harsh.
- **`square` (Drawbar Organ)**: An additive drawbar organ simulation summing multiple sine wave harmonics (1x, 2x, 3x, 4x frequencies) with authentic level ratios to sound like a vintage Hammond organ.

#### 2. Bass Synthesis Upgrades
- **`sine` (Warm Sub Bass)**: A deep sub oscillator with a pitch knock at the start (sweeping from 150% frequency down to the fundamental in 20ms) for punchy low-end presence.
- **`triangle` (Acoustic/Fretless Bass)**: A low-pitched Karplus-Strong plucked string layered with a solid sub-octave sine wave to combine natural woody rattle with clear low-end definition.
- **`sawtooth` (Acid Bassline)**: A TB-303 style saw-wave bass with high resonance ($Q = 10$) and a fast envelope sweep down the filter cutoff.
- **`square` (Retro Bass)**: Detuned square wave oscillators with a tight envelope decay for chiptune/synthwave style basslines.

#### 3. Percussion Modeling Upgrades
- **Kick**: Sweep pitch rapidly from 150Hz to 55Hz, then decay to 35Hz. Layer a short, high-pitched transient tick (simulating beater-on-skin impact) and route through a waveshaper for subtle analog saturation.
- **Snare**: Two components: (1) A triangle wave body sweeping from 180Hz to 100Hz with a quick decay, and (2) white noise representing snare wire rattle, filtered through bandpass (2000Hz) and highpass (1000Hz) filters with an exponential decay.
- **Hi-Hats (Closed/Open)**: Multi-oscillator TR-808 metal model. We mix six detuned square wave oscillators at metal-frequency ratios, run them through bandpass (10kHz) and highpass (7kHz) filters, and blend in a high-passed noise layer.
- **Clap**: Trigger four consecutive noise bursts spaced 12ms apart. Run the output through a bandpass filter centered at 1100Hz (simulating human hand resonance).
- **Tom**: Pitch sweep (180Hz to 80Hz) with a noise-stick transient impact.
- **Rim**: Detuned dual-sine resonance (1700Hz and 450Hz) through a resonant bandpass filter (1200Hz, $Q = 5$) to simulate wood rim clicks.
- **Shaker**: Amplitude-modulated noise sweep mimicking a physical shaking wrist motion.
- **Tambourine**: A metallic ring component (four high-pitched sines at 5.8kHz, 6.7kHz, 7.5kHz, 8.3kHz) blended with a short high-passed noise burst.
- **Crash Cymbal**: A complex mixture of FM-modulated square waves (320Hz modulated by 450Hz with 800Hz index) and high-pass filtered noise with a long, smooth decay ($>1.5\text{ seconds}$).
- **Ride Cymbal**: Clear high-pitch bell ding (380Hz and 580Hz sines) blended with a sizzly high-passed noise wash.
- **Cowbell**: A classic TR-808 cowbell model combining two detuned square waves (540Hz and 800Hz) through a bandpass filter (800Hz, $Q = 10$) with a sharp exponential decay.
- **Conga**: Pitch-swept sine (180Hz to 110Hz) layered with a high-pitched skin-slap transient.

---

### Component 2: Master Effects & Reverb/Delay (`script.js` & `index.html`)

We will build a stereo parallel effects routing system:
- **Delay Node**: A tempo-synced feedback delay line (set to an 8th-note delay based on BPM). It feeds back into itself and sends its output to the master gain.
- **Reverb Node**: A ConvolverNode loaded with programmatically generated stereo impulse responses (simulating exponential decay of ambient white noise).
- **Global Mix Control**: Sliders in the header to adjust the sends for Reverb and Delay.
- **Dynamic Routing**: Route all instrument outputs to an effects send bus, while keeping the metronome dry.
- **Volume Bug Fix**: declare `vol` in `playPerc` signature and multiply all drum sound amplitudes by this parameter, allowing percussion track volume sliders to finally work!

---

### Component 3: UX Upgrades & Visualizer (`index.html`, `styles.css`, `script.js`)

- **Canvas Oscilloscope**: We will add a `<canvas id="visualizer">` next to the logo. Using an `AnalyserNode` connected to the final output, we will draw a real-time glowing waveform line. The glow and color will automatically adapt to the color theme of the active mood!
- **Melody Right-Click Customization**: Enable the context menu on Melody tracks (previously restricted to Bass and Percussion) so users can override individual rows to a specific instrument (e.g. force row 3 to play Organ while row 4 plays Plucked String).

---

### File Modifications

#### [MODIFY] [index.html](file:///home/nikolas/Projects/Interactive%20Music%20Sequencer/index.html)
- Add `#visualizer` canvas element in header (wrapped in `.logo-group`).
- Add `#reverbSlider` and `#delaySlider` to the controls row in header.

#### [MODIFY] [styles.css](file:///home/nikolas/Projects/Interactive%20Music%20Sequencer/styles.css)
- Style `.logo-group` (flex container, align-items center, gap 16px).
- Style the visualizer canvas (max-width, glow filters).
- Style context menu to display custom instrument names nicely.
- Ensure control row is responsive with the two new sliders.

#### [MODIFY] [script.js](file:///home/nikolas/Projects/Interactive%20Music%20Sequencer/script.js)
- Implement `initEffects()` (Delay, Convolver Reverb with programmatic impulse response, dynamic dry/send buses).
- Implement `updateDelayTime()` synced to BPM changes.
- Upgrade `playTone()` with routing to `playFMPiano()`, `playPluckString()`, `playSynthLead()`, `playOrgan()` based on waveform string.
- Upgrade `playPerc()` with the 13 new drum models, and fix the `vol` parameter bug.
- Build the `AnalyserNode` and real-time canvas animation loop `drawVisualizer()`.
- Expand context menu to support melody tracks and map wave strings to nice names.

---

## Verification Plan

### Automated Tests
- Since it is a frontend-only application, we will verify correctness visually and audibly.

### Manual Verification
- **Acoustic Test**: Play the sequencer, switch moods, and listen to the difference. Confirm that instruments sound like physical/electric instruments rather than raw test tones.
- **Percussion Volume Check**: Modify the volume slider on the "Kick" or "Snare" track and verify that the volume changes accordingly.
- **Effects Check**: Turn up the `rev` and `del` sliders in the header and verify that audio gets echo and ambient space.
- **Visualizer Check**: Confirm the canvas waveform reacts in real-time to playback, and its color changes when switching moods (e.g., orange-red for Warm, purple for Deep).
- **Melody Override Check**: Right-click a melody track, choose an instrument, and verify that the note sound changes to the chosen model and the track label updates (e.g. to "Organ").
