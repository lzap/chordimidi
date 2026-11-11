# Chordimidi

A static Web MIDI page for seeing the notes you play, recognizing chords, and exploring the seven diatonic triads of a selected key.

## Features

- Live grand staff with every held or sustain-pedal-held MIDI note.
- Major and natural minor keys, with key signatures and note spelling.
- Exact recognition for major, minor, diminished, augmented, sus2, and sus4 triads; major, dominant, minor, half-diminished, and diminished sevenths; and major and minor sixths. Octave doublings are ignored; extra pitch classes do not trigger a partial chord match.
- Seven diatonic triads shown on piano keyboards. Click one to preview it without a MIDI device.
- Recognized three-note chords have three position keyboards; four-note chords have four.
- MIDI input selection and device hot-plug handling.

The site uses browser-native APIs and has no third-party packages or runtime services. MIDI data stays in the browser. It does not play audio or record note history.

Chord names are chosen by the bass note, then the selected key, when the same pitches fit more than one chord (for example, C6 and Am7). Recognition requires every chord tone, so incomplete jazz voicings and ninth, eleventh, or thirteenth chords are outside the current scope.

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

The workflow in `.github/workflows/pages.yml` tests, builds, and deploys `dist/` when `main` is pushed. In the GitHub repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. No `gh-pages` branch is needed.

The live URL is `https://lukas.zapletalovi.com/chordimidi/`. This account's GitHub Pages custom domain is inherited by project sites. GitHub currently links to the HTTP version, so the page immediately upgrades that address to HTTPS for Web MIDI access.
