# AI Melody Generation Guide for Interactive Music Sequencer

## JSON Structure (version 4)

```json
{
  "version": 4,
  "bpm": 120,
  "mood": "dark",
  "swing": 0,
  "pattern": 0,
  "patternBank": [],
  "patternTrackVolumes": [],
  "patternMoods": ["dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark", "dark"],
  "patternOctaves": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "overdubMode": false,
  "muted": [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  "trackOverrides": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  "trackVolumes": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  "sectionMuted": { "melody": false, "bass": false, "percussion": false },
  "quantizeStepSize": 1,
  "reverbMix": 0.25,
  "delayMix": 0.15
}
```

## Track Layout (22 tracks)

| Indices | Type | Description |
|---------|------|-------------|
| 0-11 | `melody` | 12 semitones: C, C#, D, D#, E, F, F#, G, G#, A, A#, B (octave 3) |
| 12-15 | `bass` | 4 bass tracks (follow mood's scale) |
| 16-21 | `percussion` | Kick, Snare, HH Closed, HH Open, Clap, Tom |

## Percussion Sounds (16-21)
- 16: kick
- 17: snare  
- 18: hhClosed
- 19: hhOpen
- 20: clap
- 21: tom

## Moods (12 musical scales + timbre + visual theme)

```
warm, deep, airy, edge, mellow, bright, dark, dream, cyber, neon, void, nebula
```

Each mood defines: `scale`, `wave`, `filter`, `colors`.

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

## Pattern Bank

- 16 patterns (0-15)
- Each pattern: 22 tracks × 16 steps
- Step = 1/16 note (4 steps per beat in 4/4)
- Cell value: `0` = off, `1-16` = gate length (note duration in steps)
- `patternTrackVolumes`: 16 × 22 floats (0.0-1.0) per-pattern track volumes
- `patternMoods`: array[16] of mood IDs — each pattern has its own mood
- `patternOctaves`: array[16] of integers (-3 to +3) — per-pattern octave shift
- `patternBorders`: array[16] — optional visual border style per pattern

## Overdub Mode

- Toggle with `Overdub` button (or `O` key)
- Enters "edit on top of playing pattern" mode
- Saves to a separate overdub buffer, merges on exit
- Useful for live layering while sequence plays

## Quantize / Snap

- `quantizeStepSize`: 0=off, 1=1/16, 2=1/8, 4=1/4, 8=1/2, 16=1 bar
- Applies to: cell clicks, recording, timeline grid
- Visual: non-snap steps dimmed in step header

## Swing

- `swing`: 0-50% (delay even 16th notes)
- Applied during playback scheduling

## Effects

- **Reverb**: convolution (2s impulse), mix 0-1
- **Delay**: ping-pong, tempo-synced (30/bpm), feedback 0.4, mix 0-1
- Both controlled via sliders, saved per project

## Recording & Timeline

- Real-time MIDI/keyboard recording to timeline (not step grid)
- Timeline resolution: steps or seconds
- Events stored with: track, time, type, sound/freq, volume, duration
- Playback with playhead, exportable as JSON

## Prompt Template for AI

> **Generate JSON for Interactive Music Sequencer v4:**
> - `bpm`: [tempo, e.g. 120]
> - `mood`: [one of: warm/deep/airy/edge/mellow/bright/dark/dream/cyber/neon/void/nebula]
> - `patternMoods`: array[16] of moods
> - `patternOctaves`: array[16] of integers (-3 to +3)
> - `patternBank`: 16 patterns × 22 tracks × 16 integer steps (0-16)
> - `patternTrackVolumes`: 16 × 22 floats (0.0-1.0)
> - Other fields as in example above
>
> **Track mapping:**
> - Tracks 0-11: chromatic melody (C3-B3)
> - Tracks 12-15: bass (follows mood scale degrees: 0=root, 1=2nd, 2=3rd, 3=4th)
> - Tracks 16-21: percussion (kick=16, snare=17, hhClosed=18, hhOpen=19, clap=20, tom=21)
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

## Project Management

- Multiple named projects in localStorage
- Each project: full state (patterns, moods, volumes, timeline, etc.)
- Import/export JSON files
- Auto-save on every change

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Stop |
| O | Toggle Overdub |
| ←/→ | Prev/Next pattern |
| ↑/↓ | Octave up/down |
| 1-9, 0 | Select pattern 0-9 (Shift+ for 10-15) |
| M | Toggle metronome |
| Q | Cycle quantize |
| Del/Backspace | Clear selected cell(s) |

## Tips for Generation

1. **Melody (0-11)**: Place `true` (or 1-16 for gate) on steps. Use `patternOctaves` for register shifts (+1 = octave up).
2. **Bass (12-15)**: Uses mood's scale degrees. Track 12 = root, 13 = 2nd, 14 = 3rd, 15 = 4th (varies by scale).
3. **Percussion (16-21)**: Standard grid — kick on 0,4,8,12; snare on 4,12; hats on even steps; clap on 4,12.
4. **patternMoods**: Change per pattern for song sections (intro→build→drop→breakdown).
5. **patternOctaves**: -1 for bass register, 0 for lead, +1 for high lead, +2/+3 for ear-candy.
6. **Gate length**: Use 2-4 for staccato, 8-16 for sustained pads.
7. **Volume per track**: Use `patternTrackVolumes` for mix balance (0.0-1.0).
8. **Track overrides**: Swap percussion sounds per track (e.g., tom→conga) via `trackOverrides`.