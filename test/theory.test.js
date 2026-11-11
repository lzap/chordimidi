import test from 'node:test';
import assert from 'node:assert/strict';
import { KEYS, getKey, recognizeChord, scaleForKey, spellMidiNote, triadsForKey, voicingForChord } from '../src/js/theory.js';

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

test('recognition ignores octave doublings and names inversions', () => {
  const key = getKey('C-major');
  assert.equal(recognizeChord([60, 64, 67, 72], key).displayName, 'C');
  assert.equal(recognizeChord([52, 55, 60], key).displayName, 'C/E');
  assert.equal(recognizeChord([60, 64, 67, 70], key), null);
  assert.equal(recognizeChord([60, 63, 66], key).name, 'C°');
});

test('key context chooses the diatonic spelling', () => {
  const key = getKey('Db-major');
  assert.equal(recognizeChord([61, 65, 68], key).name, 'D♭');
  assert.equal(spellMidiNote(59, getKey('Eb-minor')).label, 'C♭4');
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
