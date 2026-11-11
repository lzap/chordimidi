const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_PITCHES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const QUALITIES = {
  major: { intervals: [0, 4, 7], suffix: '', label: 'Major triad' },
  minor: { intervals: [0, 3, 7], suffix: 'm', label: 'Minor triad' },
  diminished: { intervals: [0, 3, 6], suffix: '°', label: 'Diminished triad' },
  augmented: { intervals: [0, 4, 8], suffix: '+', label: 'Augmented triad' },
  suspended2: { intervals: [0, 2, 7], suffix: 'sus2', label: 'Suspended second' },
  suspended4: { intervals: [0, 5, 7], suffix: 'sus4', label: 'Suspended fourth' },
  major7: { intervals: [0, 4, 7, 11], suffix: 'maj7', label: 'Major seventh' },
  dominant7: { intervals: [0, 4, 7, 10], suffix: '7', label: 'Dominant seventh' },
  minor7: { intervals: [0, 3, 7, 10], suffix: 'm7', label: 'Minor seventh' },
  halfDiminished7: { intervals: [0, 3, 6, 10], suffix: 'ø7', label: 'Half-diminished seventh' },
  diminished7: { intervals: [0, 3, 6, 9], suffix: '°7', label: 'Diminished seventh' },
  major6: { intervals: [0, 4, 7, 9], suffix: '6', label: 'Major sixth' },
  minor6: { intervals: [0, 3, 7, 9], suffix: 'm6', label: 'Minor sixth' },
};

const KEY_SPECS = [
  ['C', 'major', 0], ['Db', 'major', -5], ['D', 'major', 2],
  ['Eb', 'major', -3], ['E', 'major', 4], ['F', 'major', -1],
  ['Gb', 'major', -6], ['G', 'major', 1], ['Ab', 'major', -4],
  ['A', 'major', 3], ['Bb', 'major', -2], ['B', 'major', 5],
  ['A', 'minor', 0], ['Bb', 'minor', -5], ['B', 'minor', 2],
  ['C', 'minor', -3], ['C#', 'minor', 4], ['D', 'minor', -1],
  ['Eb', 'minor', -6], ['E', 'minor', 1], ['F', 'minor', -4],
  ['F#', 'minor', 3], ['G', 'minor', -2], ['G#', 'minor', 5],
];

export const KEYS = KEY_SPECS.map(([tonic, mode, signature]) => ({
  id: `${tonic}-${mode}`,
  tonic,
  mode,
  signature,
  label: `${tonic.replace('b', '♭').replace('#', '♯')} ${mode}`,
}));

export function getKey(id) {
  return KEYS.find((key) => key.id === id) || KEYS[0];
}

export function pitchClass(noteName) {
  const match = /^([A-G])([#b]?)$/.exec(noteName);
  if (!match) throw new Error(`Invalid note name: ${noteName}`);
  return (NATURAL_PITCHES[match[1]] + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0) + 12) % 12;
}

export function scaleForKey(key) {
  const rootIndex = LETTERS.indexOf(key.tonic[0]);
  const rootPitch = pitchClass(key.tonic);
  const steps = key.mode === 'minor' ? MINOR_STEPS : MAJOR_STEPS;

  return steps.map((step, index) => {
    const letter = LETTERS[(rootIndex + index) % 7];
    const pc = (rootPitch + step) % 12;
    const difference = (pc - NATURAL_PITCHES[letter] + 12) % 12;
    const accidental = difference === 1 ? '#' : difference === 11 ? 'b' : '';
    if (difference !== 0 && !accidental) throw new Error(`Cannot spell ${key.label}`);
    return { name: letter + accidental, letter, accidental, pc };
  });
}

export function qualityForIntervals(third, fifth) {
  return Object.entries(QUALITIES).find(([, value]) =>
    value.intervals.length === 3 && value.intervals[1] === third && value.intervals[2] === fifth)?.[0] || null;
}

export function chordName(rootName, quality) {
  return `${rootName.replace('b', '♭').replace('#', '♯')}${QUALITIES[quality].suffix}`;
}

export function triadsForKey(key) {
  const scale = scaleForKey(key);
  const numerals = key.mode === 'minor'
    ? ['i', 'ii', 'III', 'iv', 'v', 'VI', 'VII']
    : ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'];

  return scale.map((root, index) => {
    const third = scale[(index + 2) % 7];
    const fifth = scale[(index + 4) % 7];
    const thirdInterval = (third.pc - root.pc + 12) % 12;
    const fifthInterval = (fifth.pc - root.pc + 12) % 12;
    const quality = qualityForIntervals(thirdInterval, fifthInterval);
    return {
      rootPc: root.pc,
      rootName: root.name,
      quality,
      intervals: [0, thirdInterval, fifthInterval],
      name: chordName(root.name, quality),
      degree: numerals[index] + (quality === 'diminished' ? '°' : ''),
      noteNames: [root.name, third.name, fifth.name],
    };
  });
}

export function nameForPitchClass(pc, key) {
  const inScale = scaleForKey(key).find((note) => note.pc === pc);
  if (inScale) return inScale.name;
  return (key.signature < 0 ? FLAT_NAMES : SHARP_NAMES)[pc];
}

export function spellMidiNote(midi, key) {
  const name = nameForPitchClass(midi % 12, key);
  const letter = name[0];
  const accidental = name.slice(1);
  const offset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const octave = (midi - NATURAL_PITCHES[letter] - offset) / 12 - 1;
  return { midi, name, letter, accidental, octave,
    label: `${name.replace('b', '♭').replace('#', '♯')}${octave}` };
}

function samePitchClasses(notes, intervals, rootPc) {
  const target = intervals.map((interval) => (rootPc + interval) % 12);
  return notes.size === target.length && target.every((pc) => notes.has(pc));
}

export function recognizeChord(midiNotes, key) {
  const notes = [...new Set(midiNotes)].sort((a, b) => a - b);
  const pcs = new Set(notes.map((note) => note % 12));
  if (pcs.size !== 3 && pcs.size !== 4) return null;

  const bassPc = notes[0] % 12;
  const scale = scaleForKey(key);
  const inKey = [...pcs].every((pc) => scale.some((note) => note.pc === pc));
  const diatonicTriads = triadsForKey(key);
  const diatonicSevenths = scale.map((root, index) => ({
    rootPc: root.pc,
    rootName: root.name,
    degree: diatonicTriads[index].degree.replace('°', 'ø'),
    intervals: [0, 2, 4, 6].map((offset) =>
      (scale[(index + offset) % 7].pc - root.pc + 12) % 12),
  }));
  const diatonicChords = [...diatonicTriads, ...diatonicSevenths];
  const qualityOrder = Object.keys(QUALITIES);
  const candidates = [];
  for (let rootPc = 0; rootPc < 12; rootPc += 1) {
    for (const [quality, spec] of Object.entries(QUALITIES)) {
      if (!samePitchClasses(pcs, spec.intervals, rootPc)) continue;
      const diatonic = diatonicChords.find((chord) =>
        chord.rootPc === rootPc &&
        chord.intervals.length === spec.intervals.length &&
        chord.intervals.every((interval, index) => interval === spec.intervals[index]));
      candidates.push({ rootPc, quality, intervals: spec.intervals, inKey, diatonic });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) =>
    Number(b.rootPc === bassPc) - Number(a.rootPc === bassPc) ||
    Number(Boolean(b.diatonic)) - Number(Boolean(a.diatonic)) ||
    qualityOrder.indexOf(a.quality) - qualityOrder.indexOf(b.quality) ||
    a.rootPc - b.rootPc);

  const chosen = candidates[0];
  const rootName = chosen.diatonic?.rootName || nameForPitchClass(chosen.rootPc, key);
  const bassName = nameForPitchClass(bassPc, key);
  const name = chordName(rootName, chosen.quality);
  return {
    ...chosen,
    rootName,
    bassPc,
    bassName,
    name,
    displayName: bassPc === chosen.rootPc ? name : `${name}/${bassName.replace('b', '♭').replace('#', '♯')}`,
    degree: chosen.diatonic?.degree || null,
  };
}

export function voicingForChord(chord, inversion = 0) {
  const root = 60 + chord.rootPc;
  const rootPosition = chord.intervals.map((interval) => root + interval);
  return [...rootPosition.slice(inversion), ...rootPosition.slice(0, inversion).map((midi) => midi + 12)];
}
