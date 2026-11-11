import test from 'node:test';
import assert from 'node:assert/strict';
import { chordInputNotes, noteOnMidi } from '../src/js/analysis.js';

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
