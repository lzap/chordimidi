import test from 'node:test';
import assert from 'node:assert/strict';
import { KEYS, getKey, pitchClass, recognizeChord, recommendationsForKey, scaleForKey, spellMidiNote, triadsForKey, voicingForChord } from '../src/js/theory.js';
import { staffSvg } from '../src/js/staff.js';

test('every supported key has seven spelled diatonic triads', () => {
  for (const key of KEYS) {
    const scale = scaleForKey(key);
    const triads = triadsForKey(key);
    assert.equal(scale.length, 7, key.label);
    assert.equal(new Set(scale.map((note) => note.pc)).size, 7, key.label);
    assert.equal(triads.length, 7, key.label);
    for (const triad of triads) {
      assert.ok(triad.quality, `${key.label}: ${triad.rootName}`);
      assert.equal(triad.noteNames.length, 3);
      assert.ok(voicingForChord(triad).every((midi) => midi >= 60 && midi <= 83));
    }
  }
});

test('major and natural minor triads match their expected qualities', () => {
  assert.deepEqual(triadsForKey(getKey('C-major')).map((chord) => chord.name),
    ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°']);
  assert.deepEqual(triadsForKey(getKey('A-minor')).map((chord) => chord.name),
    ['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G']);
});

test('explore suggests three diatonic chords for the key and current chord', () => {
  const major = getKey('C-major');
  assert.deepEqual(recommendationsForKey(major, null).chords.map((chord) => chord.name), ['C', 'F', 'G']);
  const c = recognizeChord([60, 64, 67], major);
  assert.deepEqual(recommendationsForKey(major, c).chords.map((chord) => chord.name), ['F', 'G', 'Am']);
  const minor = getKey('A-minor');
  assert.deepEqual(recommendationsForKey(minor, null).chords.map((chord) => chord.name), ['Am', 'Dm', 'G']);
  assert.deepEqual(recommendationsForKey(minor, recognizeChord([57, 60, 64], minor)).chords.map((chord) => chord.name), ['Dm', 'F', 'G']);
  assert.deepEqual(recommendationsForKey(major, recognizeChord([60, 64, 67, 70], major)).chords.map((chord) => chord.name), ['C', 'F', 'G']);
});

test('recognition ignores octave doublings and names inversions', () => {
  const key = getKey('C-major');
  assert.equal(recognizeChord([60, 64, 67, 72], key).displayName, 'C');
  assert.equal(recognizeChord([52, 55, 60], key).displayName, 'C/E');
  assert.equal(recognizeChord([60, 64, 67, 70], key).displayName, 'C7');
  assert.equal(recognizeChord([60, 63, 66], key).name, 'C°');
});

test('recognizes common suspended, sixth, and seventh chords exactly', () => {
  const key = getKey('C-major');
  const examples = [
    [[60, 62, 67], 'Csus2'],
    [[60, 65, 67], 'Csus4'],
    [[60, 64, 67, 71], 'Cmaj7'],
    [[55, 59, 62, 65], 'G7'],
    [[57, 60, 64, 67], 'Am7'],
    [[59, 62, 65, 69], 'Bø7'],
    [[59, 62, 65, 68], 'B°7'],
    [[60, 64, 67, 69], 'C6'],
    [[60, 63, 67, 69], 'Cm6'],
  ];
  for (const [notes, name] of examples) {
    assert.equal(recognizeChord(notes, key).name, name);
  }
  assert.equal(recognizeChord([60, 64, 67, 71, 72], key).name, 'Cmaj7');
  assert.equal(recognizeChord([52, 55, 59, 60], key).displayName, 'Cmaj7/E');
  assert.equal(recognizeChord([60, 64, 67, 70, 74], key), null);
  assert.equal(recognizeChord([60, 64, 68, 71], key), null);
});

test('recognizes beginner left-hand fifth and octave patterns', () => {
  const key = getKey('C-major');
  assert.equal(recognizeChord([48, 55], key).displayName, 'C5');
  assert.equal(recognizeChord([55, 60], key).displayName, 'C5/G');
  assert.equal(recognizeChord([48, 55, 60], key).pattern, 'Root + fifth + octave');
  assert.equal(recognizeChord([48, 60], key).displayName, 'C octave');
  assert.equal(recognizeChord([48], key), null);
  assert.equal(recognizeChord([48, 52], key), null);
  assert.equal(recognizeChord([48, 72], key), null);
});

test('bass note resolves overlapping sixth and seventh names', () => {
  const key = getKey('C-major');
  assert.equal(recognizeChord([60, 64, 67, 69], key).name, 'C6');
  assert.equal(recognizeChord([57, 60, 64, 67], key).name, 'Am7');
  assert.equal(recognizeChord([59, 62, 65, 69], key).degree, 'viiø');
  assert.equal(recognizeChord([60, 64, 67, 71], key).degree, 'I');
  assert.equal(recognizeChord([60, 64, 67, 70], key).inKey, false);
});

test('key context chooses the diatonic spelling', () => {
  const key = getKey('Db-major');
  assert.equal(recognizeChord([61, 65, 68], key).name, 'D♭');
  assert.equal(spellMidiNote(59, getKey('Eb-minor')).label, 'C♭4');
});

test('recognized chord tones use harmonic spelling on notes and staff', () => {
  const key = getKey('C-major');
  const diminished = recognizeChord([60, 63, 66, 69], key);
  assert.deepEqual(diminished.noteNames, ['C', 'Eb', 'Gb', 'Bbb']);
  assert.equal(spellMidiNote(69, key, diminished).label, 'B♭♭4');
  assert.match(staffSvg([60, 63, 66, 69], key, diminished), /♭♭<\/text>/);
  assert.equal(pitchClass('Bbb'), 9);

  const dominant = recognizeChord([60, 64, 67, 70], key);
  assert.equal(spellMidiNote(70, key, dominant).label, 'B♭4');
  const sharpMajor = recognizeChord([61, 65, 68], key);
  assert.deepEqual(sharpMajor.noteNames, ['C#', 'E#', 'G#']);
  assert.equal(spellMidiNote(65, key, sharpMajor).label, 'E♯4');
  assert.equal(spellMidiNote(63, key).label, 'D♯4');
  assert.equal(recognizeChord([59, 62, 65, 68], getKey('Eb-minor')).name, 'B°7');
});

test('all inversion voicings fit the shared three-octave keyboard', () => {
  for (const key of KEYS) {
    for (const triad of triadsForKey(key)) {
      for (let inversion = 0; inversion < 3; inversion += 1) {
        const notes = voicingForChord(triad, inversion);
        assert.equal(notes.length, 3);
        assert.ok(notes.every((midi) => midi >= 60 && midi <= 95),
          `${key.label} ${triad.name} inversion ${inversion}`);
      }
    }
  }
});

test('four-note chords have four ordered voicings within the displayed keyboard', () => {
  const chord = recognizeChord([60, 64, 67, 71], getKey('C-major'));
  for (let inversion = 0; inversion < 4; inversion += 1) {
    const notes = voicingForChord(chord, inversion);
    assert.equal(notes.length, 4);
    assert.ok(notes.every((midi) => midi >= 60 && midi <= 95));
    assert.ok(notes.every((midi, index) => index === 0 || midi > notes[index - 1]));
    assert.equal(notes[0] % 12, chord.intervals[inversion] % 12);
  }
});
