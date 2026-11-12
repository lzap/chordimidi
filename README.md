# [ChordiMIDI](https://lukas.zapletalovi.com/chordimidi)

A static Web MIDI page for seeing the notes you play, recognizing chords, and exploring the seven diatonic triads of a selected key.

## Features

- Live grand staff with every held or sustain-pedal-held MIDI note.
- Major and natural minor keys, with key signatures and note spelling.
- Recognized chords spell their notes from the chord root, including double accidentals where needed; unmatched notes use the selected key. An enharmonic root is used if the key's spelling would require triple accidentals.
- Exact recognition for perfect fifths (power chords), octave pairs, major, minor, diminished, augmented, sus2, and sus4 triads; major, dominant, minor, half-diminished, and diminished sevenths; and major and minor sixths. Octave doublings of chords are ignored; extra pitch classes do not trigger a partial chord match.
- Seven diatonic triads shown on piano keyboards. Click one to preview it without a MIDI device.
- An Explore section suggests four diatonic triads to try after the current chord, or starter chords when none is recognized. These are practice ideas, not a unique harmonic answer.
- Switch on **Explore out of key** for four chromatic triads drawn from the parallel major or minor mode. Major keys offer iv, ♭III, ♭VI, and ♭VII; natural minor keys offer V, IV, I, and ii. The names and note spellings transpose with the selected key.
- Recognized three-note chords have three position keyboards; four-note chords have four.
- A detected perfect fifth or octave shows three beginner left-hand shapes: root + fifth, root + octave, and root + fifth + octave.
- MIDI input selection and device hot-plug handling.
- Learn a split key from the next MIDI note. Chord recognition then uses only notes below it, while the staff still shows everything. Clicked chord previews ignore the split.
- When extra melody notes remain sounding, recognition can infer a chord from the contiguous lower notes. The chord detail says when higher notes were ignored; an explicit split remains useful for overlapping hands.
- Arm Detect key to get an approximate key suggestion from recent played notes across the keyboard. Relative keys can sound alike; choose **Use** to apply a suggestion. The split affects chord recognition, not key detection.

The site uses browser-native APIs and has no third-party packages or runtime services. MIDI data stays in the browser. It does not play audio or store note history; key detection keeps up to 64 recent note-on events in memory while armed.

Chord names are chosen by the bass note, then the selected key, when the same pitches fit more than one chord (for example, C6 and Am7). Exact matching is preferred; the lower-note fallback only ignores higher notes and still requires every chord tone. Incomplete jazz voicings and ninth, eleventh, or thirteenth chords are outside the current scope.

## Run locally

Use Node.js 20 or newer:

```sh
npm run dev
```

Open `http://127.0.0.1:4173/` in a browser with Web MIDI support. Click **Connect MIDI** and grant device access. You can click any triad card to try the page without hardware.

## Check and build

```sh
npm test
npm run build
```

The build writes the static site to `dist/` and places CSS and JavaScript in a content-versioned asset directory. This prevents browsers from reusing old assets after a deployment. Relative paths let the result work under the GitHub Pages project path, `/chordimidi/`.

## Publish

The workflow in `.github/workflows/pages.yml` tests, builds, and deploys `dist/` when `main` is pushed. In the GitHub repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. No `gh-pages` branch is needed. The live URL is `https://lukas.zapletalovi.com/chordimidi/`.

## License

Copyright (C) 2026 Lukas Zapletal. ChordiMIDI is licensed under the GNU General Public License, version 3 or (at your option) any later version. See [LICENSE](LICENSE).
