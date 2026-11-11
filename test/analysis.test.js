import test from 'node:test';
import assert from 'node:assert/strict';
import { chordInputNotes, guessKeys, noteOnMidi } from '../src/js/analysis.js';

test('split learning captures note-on with positive velocity only', () => {
  assert.equal(noteOnMidi([0x90, 60, 100]), 60);
  assert.equal(noteOnMidi([0x91, 61, 1]), 61);
  assert.equal(noteOnMidi([0x90, 60, 0]), null);
  assert.equal(noteOnMidi([0x80, 60, 50]), null);
  assert.equal(noteOnMidi([0xb0, 64, 127]), null);
});

test('split excludes its boundary from chord input, including sustained notes', () => {
  const notes = [
    { midi: 48, state: 'held' },
    { midi: 55, state: 'sustained' },
    { midi: 60, state: 'held' },
    { midi: 72, state: 'held' },
  ];
  assert.deepEqual(chordInputNotes(notes, 60).map((note) => note.midi), [48, 55]);
  assert.equal(chordInputNotes(notes, null), notes);
  assert.equal(chordInputNotes(notes, 60, true), notes);
});

test('key guesses wait for a phrase and distinguish tonic emphasis in relative keys', () => {
  assert.deepEqual(guessKeys([60, 64, 67, 60, 64]), []);
  assert.deepEqual(guessKeys([60, 64, 67, 60, 64, 67]), []);
  const cMajor = [60, 64, 67, 60, 65, 67, 69, 71, 72, 67, 64, 60];
  const aMinor = [57, 60, 64, 57, 62, 64, 65, 67, 69, 64, 60, 57];
  const gMajor = [55, 59, 62, 55, 60, 62, 64, 66, 67, 62, 59, 55];
  assert.deepEqual(guessKeys(cMajor).map((key) => key.id), ['C-major', 'A-minor']);
  assert.deepEqual(guessKeys(aMinor).map((key) => key.id), ['A-minor', 'C-major']);
  assert.deepEqual(guessKeys(gMajor).map((key) => key.id), ['G-major', 'E-minor']);
});
