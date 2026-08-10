# AI Melody Generation Guide for Interactive Music Sequencer

## JSON Structure (version 4)

```json
{
  "version": 4,
  "steps": 16,
  "bpm": 110,
  "mood": "dark",
  "swing": 0,
  "pattern": 0,
  "patternBank": [],
  "patternTrackVolumes": [],
  "patternMoods": ["dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark"],
  "patternOctaves": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "patternGlides": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "patternBorders": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  "overdubMode": false,
  "muted": [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  "trackOverrides": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  "trackVolumes": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  "trackGlide": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "sectionMuted": { "melody": false, "bass": false, "percussion": false },
  "quantizeStepSize": 1,
  "reverbMix": 0.25,
  "delayMix": 0.15,
  "scaleHighlightEnabled": false,
  "scaleRoot": 0,
  "scaleType": "major"
}
```

## Track Layout (46 tracks)

| Indices | Type | Count | Description |
|---------|------|-------|-------------|
| 0-35 | `melody` | 36 | 3 octaves: C2..B4 (C2, C#2, D2... B4) |
| 36-39 | `bass` | 4 | 4 bass tracks (follow mood's scale degrees) |
| 40-45 | `percussion` | 6 | Kick, Snare, HH Closed, HH Open, Clap, Tom |

### Melody Track Mapping (36 tracks, 3 octaves)

```
Row  0: C2   Row 12: C3   Row 24: C4   (middle C reference)
Row  1: C#2  Row 13: C#3  Row 25: C#4
Row  2: D2   Row 14: D3   Row 26: D4
Row  3: D#2  Row 15: D#3  Row 27: D#4
Row  4: E2   Row 16: E3   Row 28: E4
Row  5: F2   Row 17: F3   Row 29: F4
Row  6: F#2  Row 18: F#3  Row 30: F#4
Row  7: G2   Row 19: G3   Row 31: G4
Row  8: G#2  Row 20: G#3  Row 32: G#4
Row  9: A2   Row 21: A3   Row 33: A4
Row 10: A#2  Row 22: A#3  Row 34: A#4
Row 11: B2   Row 23: B3   Row 35: B4
```

### Bass Tracks (36-39)

| Index | Scale Degree | Description |
|-------|--------------|-------------|
| 36 | 0 (root) | Root note of mood scale |
| 37 | 1 (2nd) | Second degree |
| 38 | 2 (3rd) | Third degree |
| 39 | 3 (4th) | Fourth degree |

### Percussion Sounds (40-45)

| Index | Sound | ID |
|-------|-------|----|
| 40 | Kick | `kick` |
| 41 | Snare | `snare` |
| 42 | HH Closed | `hhClosed` |
| 43 | HH Open | `hhOpen` |
| 44 | Clap | `clap` |
| 45 | Tom | `tom` |

**Extended sounds** (available via context menu / track overrides):
`rim`, `shaker`, `tamb`, `crash`, `ride`, `cowbell`, `conga`

## Moods (12 musical scales + timbre + visual theme)

```
warm, deep, airy, edge, mellow, bright, dark, dream, cyber, neon, void, nebula
```

Each mood defines: `scale`, `wave`, `filter`, `colors` (bg + 4 accent colors).

| Mood | Scale | Wave | Filter | Character |
|------|-------|------|--------|-----------|
| warm | major | sine | 4800 Hz | mellow, analog |
| deep | minor | sawtooth | 900 Hz | dark, sub-heavy |
| airy | pentatonic | triangle | 4500 Hz | open, ethereal |
| edge | blues | square | 1800 Hz | gritty, aggressive |
| mellow | dorian | sine | 3800 Hz | smooth, jazzy |
| bright | mixolydian | triangle | 6500 Hz | crisp, sparkling |
| dark | harmonicMinor | sawtooth | 600 Hz | tense, cinematic |
| dream | wholeTone | triangle | 5000 Hz | surreal, floating |
| cyber | harmonicMinor | square | 1400 Hz | digital, industrial |
| neon | minor | sawtooth | 1600 Hz | retro, synthwave |
| void | wholeTone | sine | 5500 Hz | minimal, hollow |
| nebula | pentatonic | triangle | 4500 Hz | cosmic, spacious |

### Mood Wave Types (synthesis)

| Wave | Melody Engine | Bass Engine |
|------|---------------|-------------|
| `sine` | FM Piano/Bell | Sub Bass |
| `triangle` | Plucked String | Acoustic/Fretless Bass |
| `sawtooth` | Analog Synth Lead | Acid Bassline |
| `square` | Drawbar Organ | Retro Square Bass |

### Scale Definitions (semitones from root)

```js
const SCALES = {
  major:      [0, 2, 4, 5, 7, 9, 11, 12],
  minor:      [0, 2, 3, 5, 7, 8, 10, 12],
  pentatonic: [0, 2, 4, 7, 9, 12, 14, 16],
  blues:      [0, 3, 5, 6, 7, 10, 12, 15],
  dorian:     [0, 2, 3, 5, 7, 9, 10, 12],
  mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11, 12],
  wholeTone:  [0, 2, 4, 6, 8, 10, 12, 14],
  chromatic:  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};
```

## Pattern Bank

- 16 patterns (0-15)
- Each pattern: 46 tracks × N steps (N = 16, 32, 64, or 128)
- Step = 1/16 note (4 steps per beat in 4/4)
- Cell value: `0` = off, `1-16` = gate length (note duration in steps)
- `patternTrackVolumes`: 16 × 46 floats (0.0-1.0) per-pattern track volumes
- `patternMoods`: array[16] of mood IDs — each pattern has its own mood
- `patternOctaves`: array[16] of integers (-3 to +3) — per-pattern octave shift
- `patternGlides`: array[16] of floats (0-1) — per-pattern glide/portamento time in seconds
- `patternBorders`: array[16] — optional visual border color per pattern (hex string)

## Pattern Steps

- Variable pattern length: 16, 32, 64, or 128 steps
- Changed via `steps` field in JSON or UI dropdown
- All 16 patterns share the same step count

## Sample Engine

Full sample playback system supporting:

### Sample Types
- **Tonal samples** — pitched, loopable, multi-sample (rootNote, loopStart, loopEnd)
- **One-shots** — drums, FX, non-pitched

### Factory Banks (auto-generated on first run)
- **Bass**: sub (sine C2/C1), acid (sawtooth C2/C1), FM (sine C2), reese (sawtooth C2)
- **Melody**: piano (sine C4/C5), pluck (triangle C4/C5), saw (sawtooth C4/C5), square (C4/C5), organ (sine C4/C5)

### Track Sample Assignment
- Any track can have a sample assigned via context menu → "Load Sample..."
- Sample browser in sidebar: load custom .wav/.mp3/.ogg/.flac/.aiff files
- Assigned samples override synthesis for that track
- Tonal samples play at correct pitch via `playbackRate` (respects `rootNote`)
- One-shots play at original pitch (or with `pitch` semitone offset)

### Sample Metadata
```js
{
  sampleId: "my-sample",
  name: "My Sample",
  duration: 1.5,
  rootNote: 60,      // MIDI note (C4 = 60)
  loop: true,
  loopStart: 0.2,
  loopEnd: 1.3,
  isTonal: true
}
```

## Overdub Mode

- Toggle with `Overdub` button (or `R` key)
- Enters "edit on top of playing pattern" mode
- Ghost notes show underlying pattern
- Saves to a separate overdub buffer, merges on exit
- Useful for live layering while sequence plays
- Pattern switching queued at loop boundary

## Quantize / Snap

- `quantizeStepSize`: 0=off, 1=1/16, 2=1/8, 4=1/4, 8=1/2, 16=1 bar
- Applies to: cell clicks, recording, timeline grid
- Visual: non-snap steps dimmed in step header

## Swing

- `swing`: 0-50% (delay even 16th notes)
- Applied during playback scheduling

## Glide / Portamento

- Per-track glide time: 0-1000ms (set via context menu or global slider)
- Applies to tonal tracks (melody + bass) — both synthesis and samples
- For synthesis: exponential frequency ramp + filter ramp
- For samples: `playbackRate` exponential ramp
- Per-pattern glide saved in `patternGlides`

## Effects

- **Reverb**: convolution (2s impulse), mix 0-1
- **Delay**: ping-pong, tempo-synced (30/bpm), feedback 0.4, mix 0-1
- Both controlled via sliders, saved per project

## Recording & Timeline

- Real-time MIDI/keyboard recording to timeline (not step grid)
- Timeline resolution: steps or seconds
- Events stored with: track, time, type, sound/freq, volume, duration
- Playback with playhead, exportable as JSON
- Drag-to-move events on timeline grid

## Scale Highlighting

- Visual scale display on melody tracks
- Configurable root (0-11) and scale type (all SCALES keys)
- Highlights in-scale rows, dims out-of-scale, marks root note
- Saved per project

## Project Management

- Multiple named projects in localStorage
- Each project: full state (patterns, moods, volumes, timeline, samples, etc.)
- Import/export JSON files
- Auto-save on every change
- Project list in sidebar with create/delete/switch

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Stop |
| R | Toggle Overdub |
| Shift+R | Toggle Record |
| O | Toggle Preview |
| ←/→ | Prev/Next pattern |
| ↑/↓ | Octave up/down |
| 1-9 | Select pattern 0-9 (Shift+ for 10-15) |
| B | Toggle Bass section mute |
| P | Toggle Percussion section mute |
| M | Toggle Melody section mute |
| C | Clear pattern |
| S | Stop |
| Q | Cycle quantize |
| Del/Backspace | Clear selected cell(s) |
| ? / / | Show help |
| Esc | Close help/menus |

## Prompt Template for AI

> **Generate JSON for Interactive Music Sequencer v4:**
> - `bpm`: [tempo, e.g. 110]
> - `steps`: [16, 32, 64, or 128]
> - `mood`: [one of: warm/deep/airy/edge/mellow/bright/dark/dream/cyber/neon/void/nebula]
> - `patternMoods`: array[16] of moods
> - `patternOctaves`: array[16] of integers (-3 to +3)
> - `patternGlides`: array[16] of floats (0-1, seconds)
> - `patternBank`: 16 patterns × 46 tracks × N integer steps (0-16)
> - `patternTrackVolumes`: 16 × 46 floats (0.0-1.0)
> - `trackOverrides`: array[46] — instrument override per track (see below)
> - `trackGlide`: array[46] — glide time per track in seconds (0-1)
> - Other fields as in example above
>
> **Track mapping:**
> - Tracks 0-35: chromatic melody (C2-B4, 3 octaves)
> - Tracks 36-39: bass (mood scale degrees: 0=root, 1=2nd, 2=3rd, 3=4th)
> - Tracks 40-45: percussion (kick=40, snare=41, hhClosed=42, hhOpen=43, clap=44, tom=45)
>
> **Track overrides (trackOverrides):**
> - Melody: `sine` (FM Piano), `triangle` (Pluck), `sawtooth` (Synth), `square` (Organ), or `null` (mood default)
> - Bass: `sine` (Sub), `triangle` (Acoustic), `sawtooth` (Acid), `square` (Retro), or `null` (mood default)
> - Percussion: `kick`, `snare`, `hhClosed`, `hhOpen`, `clap`, `tom`, `rim`, `shaker`, `tamb`, `crash`, `ride`, `cowbell`, `conga`, or `null` (track default)
>
> **Style:** [ambient/techno/classical/jazz/house/dnb/etc.]
> **Key:** [e.g. C# minor, A major]
> **Time signature:** [4/4, 3/4, 6/8]
> **Complexity:** [simple/medium/virtuosic]

## Gate Length (Note Duration)

- Cell value = gate steps (1-16)
- Right handle on last cell of a gate: drag to extend/shrink
- Left handle on first cell: drag to shift start + resize
- Context menu on any cell: gate presets [1,2,3,4,6,8,12,16]
- Default gate for new notes: `defaultGate` (updated after each gate edit)
- Gate visual: sustained cells show as `gate-sust`, end cell as `gate-end`

## Visualizer

- Real-time waveform display in sidebar
- Color matches current mood's primary color
- Auto-starts with audio context

## Layout Options

- **Centered** (default): grid centered with max-width
- **Full**: grid uses full viewport width
- Toggle via Menu → View → Width

## Section Visibility

- Toggle show/hide: Bass, Percussion, Samples (sidebar tracks)
- Menu → View → Show
- Persisted in localStorage

## Tips for Generation

1. **Melody (0-35)**: Place notes across 3 octaves. Use `patternOctaves` for global register shifts (+1 = octave up). Row 24 = C4 (middle C).

2. **Bass (36-39)**: Uses mood's scale degrees. Track 36 = root, 37 = 2nd, 38 = 3rd, 39 = 4th (varies by scale).

3. **Percussion (40-45)**: Standard grid — kick on 0,4,8,12; snare on 4,12; hats on even steps; clap on 4,12.

4. **patternMoods**: Change per pattern for song sections (intro→build→drop→breakdown).

5. **patternOctaves**: -1 for bass register, 0 for lead, +1 for high lead, +2/+3 for ear-candy.

6. **patternGlides**: 0.05-0.2 for expressive slides, 0.5+ for slow portamento.

7. **Gate length**: Use 2-4 for staccato, 8-16 for sustained pads.

8. **Volume per track**: Use `patternTrackVolumes` for mix balance (0.0-1.0).

9. **Track overrides**: Swap instruments per track via `trackOverrides` (e.g., `sawtooth` for acid bass, `conga` for tom).

10. **Samples**: Assign tonal samples to melody/bass tracks for realistic instruments; one-shots to percussion.

11. **Scale highlighting**: Set `scaleRoot` + `scaleType` + `scaleHighlightEnabled: true` to guide melody writing visually.

12. **Pattern steps**: Use 32/64/128 for longer evolving patterns; 16 for standard loops.

13. **Pattern borders**: Color-code patterns visually (e.g., red for drops, blue for breakdowns).

(End of file - total 432 lines)