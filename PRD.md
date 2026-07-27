# PRD: Interactive Music Sequencer

## 1. Vision

A browser-based step sequencer that lets anyone compose rhythmic and melodic patterns instantly — no setup, no install, no musical theory required. Open a single HTML file and make music.

## 2. Target Audience

- Musicians & producers sketching ideas
- Hobbyists learning rhythm / melody
- Live performers needing a lightweight loop tool
- Web audio / creative coding enthusiasts

## 3. Functional Requirements

### 3.1 Core Sequencer
- 16-step grid with playhead
- Configurable BPM (40–200)
- 18 tracks across 3 sections: melody (8), bass (4), percussion (6)
- Play / Pause / Stop transport controls
- Visual playhead tracking the current step
- Click cells to toggle notes on/off

### 3.2 Audio Engine
- Web Audio API synthesis (no samples needed)
- 4 oscillator types: sine, sawtooth, triangle, square
- Low-pass filter per note with envelope
- WaveShaper soft-clipping for warmth
- Percussion synthesis: kick, snare, hi-hat (open/closed), clap, tom, rim, shaker, tambourine, crash, ride, cowbell, conga

### 3.3 Mood System
- 12 moods: Warm, Deep, Airy, Edge, Mellow, Bright, Dark, Dream, Cyber, Neon, Void, Nebula
- Each mood defines: scale (major, minor, pentatonic, blues, dorian, mixolydian, harmonic minor, whole tone), waveform, filter cutoff, color palette, background gradient
- Visual theming — colors, backgrounds, cell glow change with mood

### 3.4 Pattern System
- 16 pattern slots
- Each pattern stores its own notes, mood assignment, and octave shift
- Switch patterns during playback (no interruption)
- Pattern has-notes indicator dots
- Copy pattern between slots

### 3.5 Rec Mode
- Toggle Rec (hotkey R) to enter composition mode
- Playing pattern continues looping in the background
- Switch to another slot, edit, return — original pattern preserved
- Ghost notes show the playing pattern's cells as dim overlays

### 3.6 Track Controls
- Per-track volume (vertical drag bar)
- Per-track mute (click track name or ♫ button)
- Per-track sound override (right-click context menu):
  - Percussion tracks: swap between 13 sounds
  - Bass tracks: override waveform (sine, square, sawtooth, triangle)
- Section mute: toggle melody / bass / percussion entire section

### 3.7 Hotkeys
| Key | Action |
|-----|--------|
| Space | Play / Pause |
| 1–9 | Select pattern |
| ↑ / ↓ | Octave shift |
| R | Toggle Rec mode |
| S | Stop |
| C | Clear pattern |
| B / P / M | Toggle Bass / Percussion / Melody section |
| ? / / | Show help modal |
| Esc | Close help |

### 3.8 Persistence & Data
- Auto-save to localStorage (full state: all patterns, moods, octaves, volumes, overrides, mutes)
- Export all patterns + config to JSON file download
- Import from JSON file
- Demo pattern on first launch

### 3.9 UI / UX
- Glassmorphism design with backdrop blur
- Dark theme with dynamic ambient gradients per mood
- Smooth playhead highlight on active step
- Row hover highlighting
- Responsive layout (min-width ~380px, scrollable grid)
- Help modal with all hotkeys
- Status bar: play state, step counter, mood tag

## 4. Non-Functional Requirements

- Zero dependencies — vanilla HTML / CSS / JS
- Runs in any modern browser (Chrome, Firefox, Safari, Edge)
- No backend, no server, no network required
- All sound synthesis in-browser via Web Audio API
- State persistence via localStorage only
- File size < 100 KB total

## 5. Architecture

```
index.html      — DOM structure, fonts, meta
styles.css      — glassmorphism theme, mood backgrounds, grid layout, modal, context menu
script.js       — all logic: audio engine, UI, state management, serialization
```

### Audio Graph
```
Oscillator → BiquadFilter (low-pass) → WaveShaper → Gain (envelope) → Master Gain → Destination
NoiseSource → HighPass + LowPass → Gain → Master Gain (for percussion noise components)
```

## 6. User Flows

### First Launch
1. Open `index.html` → demo pattern loads with Warm mood
2. Click cells to add/remove notes
3. Press Space → sequencer plays
4. Switch mood dropdown → scale + sound + colors change
5. Adjust BPM slider → tempo changes immediately

### Compose a New Pattern
1. Press R (Rec mode) → current pattern keeps looping
2. Click pattern 2 → empty slot (or copy existing via Copy)
3. Add notes; ghost notes from pattern 1 shown dimly
4. Press R again → edited pattern starts playing

### Export / Share
1. Click Export → downloads `sequencer-pattern.json`
2. Share the file; recipient clicks Import → loads full state

## 7. Future Considerations

- MIDI input / output
- Additional effects (delay, reverb, distortion)
- Per-step velocity / probability
- Swing / shuffle
- Drag-to-paint on grid
- Audio recording export (WAV)
- Mobile touch optimization
- Synth parameter per track (ADSR, filter envelope)

## 8. Glossary

| Term | Definition |
|------|------------|
| Step | One of 16 positions in a bar (16th note) |
| Pattern | A complete 16-step arrangement across all tracks |
| Track | A single row — one note (melody/bass) or one sound (percussion) |
| Mood | A named preset combining scale, waveform, filter, and colors |
| Rec mode | Composition mode where background playback continues while editing another pattern |
| Ghost notes | Dim overlay showing the currently-playing pattern's notes |
| Section | Group of tracks: melody (8), bass (4), percussion (6) |