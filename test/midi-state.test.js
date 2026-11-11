import test from 'node:test';
import assert from 'node:assert/strict';
import { MidiNoteTracker } from '../src/js/midi-state.js';

test('note-on velocity zero acts as note-off', () => {
  const tracker = new MidiNoteTracker();
  tracker.receive('keyboard', [0x90, 60, 90]);
  assert.deepEqual(tracker.snapshot().notes, [{ midi: 60, state: 'held' }]);
  tracker.receive('keyboard', [0x90, 60, 0]);
  assert.deepEqual(tracker.snapshot().notes, []);
});

test('sustain holds released notes and clears them when lifted', () => {
  const tracker = new MidiNoteTracker();
  tracker.receive('keyboard', [0x90, 60, 90]);
  tracker.receive('keyboard', [0xb0, 64, 127]);
  tracker.receive('keyboard', [0x80, 60, 64]);
  assert.deepEqual(tracker.snapshot(), {
    notes: [{ midi: 60, state: 'sustained' }], pedal: true,
  });
  tracker.receive('keyboard', [0xb0, 64, 63]);
  assert.deepEqual(tracker.snapshot(), { notes: [], pedal: false });
});

test('restriking a sustained note and other channels remain independent', () => {
  const tracker = new MidiNoteTracker();
  tracker.receive('keyboard', [0x90, 60, 80]);
  tracker.receive('keyboard', [0xb0, 64, 127]);
  tracker.receive('keyboard', [0x80, 60, 0]);
  tracker.receive('keyboard', [0x90, 60, 80]);
  tracker.receive('keyboard', [0x91, 64, 80]);
  tracker.receive('keyboard', [0xb0, 64, 0]);
  assert.deepEqual(tracker.snapshot().notes, [
    { midi: 60, state: 'held' }, { midi: 64, state: 'held' },
  ]);
  tracker.receive('keyboard', [0xb0, 123, 0]);
  assert.deepEqual(tracker.snapshot().notes, [{ midi: 64, state: 'held' }]);
  tracker.clearSource('keyboard');
  assert.deepEqual(tracker.snapshot().notes, []);
});
