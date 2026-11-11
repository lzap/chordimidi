# Chordimidi

A static Web MIDI page for seeing the notes you play, recognizing basic triads, and exploring the seven diatonic triads of a selected key.

## Features

- Live grand staff with every held or sustain-pedal-held MIDI note.
- Major and natural minor keys, with key signatures and note spelling.
- Exact triad recognition for major, minor, diminished, and augmented chords. Octave doublings are ignored; extra pitch classes do not trigger a partial chord match.
- Seven diatonic triads shown on piano keyboards. Click one to preview it without a MIDI device.
- A recognized triad displayed in root position and both inversions on three equal-sized keyboards.
- MIDI input selection and device hot-plug handling.

The site uses browser-native APIs and has no third-party packages or runtime services. MIDI data stays in the browser. It does not play audio or record note history.

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

The build copies the static site into `dist/`. Relative paths let the result work under the GitHub Pages project path, `/chordimidi/`.

## Publish

The workflow in `.github/workflows/pages.yml` tests, builds, and deploys `dist/` when `main` is pushed. In the GitHub repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. No `gh-pages` branch is needed.

The expected URL is `https://lzap.github.io/chordimidi/`.
