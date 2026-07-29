# AI Melody Generation Guide for Interactive Music Sequencer

## JSON Structure (version 3)

```json
{
  "version": 3,
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
| 12-15 | `bass` | 4 bass tracks (use mood's scale) |
| 16-21 | `percussion` | Kick, Snare, HH Closed, HH Open, Clap, Tom |

## Moods (musical scales + timbre)

```
warm, deep, airy, edge, mellow, bright, dark, dream, cyber, neon, void, nebula
```

Each mood defines: `scale`, `wave`, `filter`, `colors`.

## Pattern Bank

- 16 patterns (0-15)
- Each pattern: 22 tracks × 16 steps (boolean)
- Step = 1/16 note (4 steps per beat in 4/4)
- `patternTrackVolumes`: 16 × 22 floats (0.0-1.0)

## Prompt Template for AI

> **Generate JSON for Interactive Music Sequencer v3:**
> - `bpm`: [tempo, e.g. 120]
> - `mood`: [one of: warm/deep/airy/edge/mellow/bright/dark/dream/cyber/neon/void/nebula]
> - `patternMoods`: array[16] of moods
> - `patternOctaves`: array[16] of integers (-2 to +2)
> - `patternBank`: 16 patterns × 22 tracks × 16 boolean steps
> - `patternTrackVolumes`: 16 × 22 floats (0.0-1.0)
> - Other fields as in example above
>
> **Track mapping:**
> - Tracks 0-11: chromatic melody (C3-B3)
> - Tracks 12-15: bass (follows mood scale)
> - Tracks 16-21: percussion (kick=16, snare=17, hhClosed=18, hhOpen=19, clap=20, tom=21)
>
> **Style:** [ambient/techno/classical/jazz/house/dnb/etc.]
> **Key:** [e.g. C# minor, A major]
> **Time signature:** [4/4, 3/4, 6/8]
> **Complexity:** [simple/medium/virtuosic]

## Tips

1. **Melody (0-11)**: Place `true` on steps where note sounds. Use `patternOctaves` for register shifts (+1 = octave up).
2. **Bass (12-15)**: Uses mood's scale degrees. Track 12 = root, 13 = 2nd, 14 = 3rd, 15 = 4th degree (varies by scale).
3. **Percussion (16-21)**: Standard grid — kick on 0,4,8,12; snare on 4,12; hats on even steps.
4. **patternMoods**: Change per pattern for sections (intro→build→drop→breakdown).
5. **patternOctaves**: -1 for bass register, 0 for lead, +1 for high lead.