import { KEYS, pitchClass, recognizeChord } from './theory.js';

// A small pitch-class profile: tonic and fifth are useful clues, while notes
// outside the scale lower a candidate's score. Relative keys remain possible.
const PROFILES = {
  major: [3, -2, 1, -2, 1.5, 1, -2, 2, -2, 1, -2, 1],
  minor: [3, -2, 1, 1.5, -2, 1, -2, 2, 1, -2, 1, 0.5],
};

export function noteOnMidi(data) {
  return data?.length >= 3 && (data[0] & 0xf0) === 0x90 && data[2] > 0
    ? data[1] : null;
}

export function chordInputNotes(notes, splitNote, isPreview = false) {
  return isPreview || splitNote === null ? notes : notes.filter((note) => note.midi < splitNote);
}

export function recognizeChordWithMelody(midiNotes, key) {
  const exact = recognizeChord(midiNotes, key);
  if (exact) return exact;

  const notes = [...new Set(midiNotes)].sort((a, b) => a - b);
  // A left-hand shape normally sits at the bottom. Try contiguous low notes,
  // within an octave plus a fifth, without cherry-picking arbitrary subsets.
  for (let count = notes.length - 1; count >= 2; count -= 1) {
    if (notes[count - 1] - notes[0] > 19) continue;
    const chord = recognizeChord(notes.slice(0, count), key);
    if (chord) return { ...chord, ignoredUpperNotes: notes.length - count };
  }
  return null;
}

export function guessKeys(midiNotes) {
  const recent = midiNotes.slice(-64);
  const pcs = recent.map((note) => note % 12);
  if (pcs.length < 6 || new Set(pcs).size < 4) return [];

  const candidates = KEYS.map((key) => {
    const tonic = pitchClass(key.tonic);
    const profile = PROFILES[key.mode];
    const score = pcs.reduce((total, pc) => total + profile[(pc - tonic + 12) % 12], 0);
    return { key, score };
  });
  candidates.sort((a, b) => b.score - a.score || a.key.id.localeCompare(b.key.id));
  return candidates.slice(0, 2).map(({ key }) => key);
}
