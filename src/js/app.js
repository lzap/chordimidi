import { KEYS, QUALITIES, chromaticChordsForKey, getKey, recommendationsForKey, spellMidiNote, triadsForKey, voicingForChord } from './theory.js';
import { MidiNoteTracker } from './midi-state.js';
import { chordInputNotes, guessKeys, noteOnMidi, recognizeChordWithMelody } from './analysis.js';
import { staffSvg } from './staff.js';
import { createPiano } from './piano.js';

const elements = {
  keySelect: document.querySelector('#key-select'),
  inputSelect: document.querySelector('#midi-input-select'),
  connectButton: document.querySelector('#connect-button'),
  midiStatus: document.querySelector('#midi-status'),
  detectKeyButton: document.querySelector('#detect-key-button'),
  keyDetectionStatus: document.querySelector('#key-detection-status'),
  useDetectedKey: document.querySelector('#use-detected-key'),
  splitButton: document.querySelector('#split-button'),
  splitStatus: document.querySelector('#split-status'),
  clearSplit: document.querySelector('#clear-split'),
  liveMode: document.querySelector('#live-mode'),
  clearPreview: document.querySelector('#clear-preview'),
  staffKeyLabel: document.querySelector('#staff-key-label'),
  noteCount: document.querySelector('#note-count'),
  liveStaff: document.querySelector('#live-staff'),
  noteList: document.querySelector('#note-list'),
  chordName: document.querySelector('#chord-name'),
  chordDetail: document.querySelector('#chord-detail'),
  degreeBadge: document.querySelector('#degree-badge'),
  pedalBadge: document.querySelector('#pedal-badge'),
  triadGrid: document.querySelector('#triad-grid'),
  inversionGrid: document.querySelector('#inversion-grid'),
  inversionsHeading: document.querySelector('#inversions-heading'),
  inversionCaption: document.querySelector('#inversion-caption'),
  exploreGrid: document.querySelector('#explore-grid'),
  exploreCaption: document.querySelector('#explore-caption'),
  exploreOutOfKey: document.querySelector('#explore-out-of-key'),
};

const tracker = new MidiNoteTracker();
let access = null;
let selectedInput = null;
let preview = null;
let key = getKey(readSavedKey());
let splitNote = readSavedSplit();
let splitArmed = false;
let detectingKey = false;
let keySamples = [];
let keySuggestions = [];

function readSavedKey() {
  try { return localStorage.getItem('chordimidi-key'); }
  catch { return null; }
}

function saveKey(id) {
  try { localStorage.setItem('chordimidi-key', id); }
  catch { /* Browsers may block storage. */ }
}

function readSavedSplit() {
  try {
    const saved = localStorage.getItem('chordimidi-split');
    if (saved === null) return null;
    const note = Number(saved);
    return Number.isInteger(note) && note >= 0 && note <= 127 ? note : null;
  } catch { return null; }
}

function saveSplit() {
  try {
    if (splitNote === null) localStorage.removeItem('chordimidi-split');
    else localStorage.setItem('chordimidi-split', String(splitNote));
  } catch { /* Browsers may block storage. */ }
}

function renderSplitStatus() {
  elements.splitButton.setAttribute('aria-pressed', String(splitArmed));
  elements.splitButton.textContent = splitArmed ? 'Cancel learning' : 'Learn split';
  const boundary = splitNote === null ? '' : spellMidiNote(splitNote, key).label;
  if (splitArmed) {
    elements.splitStatus.textContent = selectedInput
      ? `Play a key to set split${boundary ? ` · currently below ${boundary}` : ''}`
      : 'Connect MIDI, then play a key to set split';
  } else {
    elements.splitStatus.textContent = boundary
      ? `Chords use notes below ${boundary}` : 'Split off · all notes count toward chords';
  }
  elements.clearSplit.hidden = splitNote === null;
}

function renderKeyDetectionStatus() {
  elements.detectKeyButton.setAttribute('aria-pressed', String(detectingKey));
  elements.detectKeyButton.textContent = detectingKey ? 'Stop detecting' : 'Detect key';
  const [first, second] = keySuggestions;
  if (first) {
    const lead = detectingKey
      ? keySamples.length >= 12 && new Set(keySamples.map((note) => note % 12)).size >= 5
        ? 'Key guess' : 'Early guess'
      : 'Last guess';
    elements.keyDetectionStatus.textContent = `${lead}: ${first.label} · also ${second.label}`;
  } else if (detectingKey) {
    elements.keyDetectionStatus.textContent = selectedInput
      ? `Listening for key · ${keySamples.length} ${keySamples.length === 1 ? 'note' : 'notes'} played`
      : 'Connect MIDI, then play notes to detect key';
  } else {
    elements.keyDetectionStatus.textContent = 'Key detection off';
  }
  elements.useDetectedKey.hidden = !first;
  if (first) elements.useDetectedKey.textContent = `Use ${first.label}`;
}

function setStatus(message, kind = '') {
  elements.midiStatus.textContent = message;
  elements.midiStatus.className = `connection-status${kind ? ` is-${kind}` : ''}`;
}

function renderKeyOptions() {
  for (const mode of ['major', 'minor']) {
    const group = document.createElement('optgroup');
    group.label = mode === 'major' ? 'Major keys' : 'Natural minor keys';
    for (const item of KEYS.filter((candidate) => candidate.mode === mode)) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.label;
      group.append(option);
    }
    elements.keySelect.append(group);
  }
  elements.keySelect.value = key.id;
}

function appendPianoRange(card, start, end) {
  const range = document.createElement('div');
  range.className = 'piano-range';
  range.innerHTML = `<span>C${Math.floor(start / 12) - 1}</span><span>B${Math.floor(end / 12) - 1}</span>`;
  card.append(range);
}

function createTriadCard(triad) {
  const notes = voicingForChord(triad);
  const card = document.createElement('button');
  card.type = 'button';
  card.className = `triad-card${preview?.name === triad.name ? ' is-previewing' : ''}`;
  card.setAttribute('aria-label', `Preview ${triad.name}, ${triad.noteNames.join(', ')}${triad.isChromatic ? ', outside the key' : ''}`);

  const heading = document.createElement('div');
  heading.className = 'triad-heading';
  const degree = document.createElement('span');
  degree.className = 'triad-degree';
  degree.textContent = triad.degree;
  const name = document.createElement('strong');
  name.className = 'triad-name';
  name.textContent = triad.name;
  heading.append(degree, name);

  const noteLine = document.createElement('div');
  noteLine.className = 'triad-notes';
  noteLine.textContent = triad.noteNames.map((note) => note.replaceAll('b', '♭').replaceAll('#', '♯')).join(' · ');
  card.append(heading, noteLine, createPiano(60, 83, notes, `${triad.name} piano keys`));
  appendPianoRange(card, 60, 83);
  card.addEventListener('click', () => {
    preview = { name: triad.name, notes, chord: triad.isChromatic ? triad : null };
    renderTriads();
    renderLive();
  });
  return card;
}

function renderTriads() {
  elements.triadGrid.replaceChildren(...triadsForKey(key).map(createTriadCard));
}

function renderExplore(chord) {
  if (elements.exploreOutOfKey.checked) {
    const chords = chromaticChordsForKey(key);
    elements.exploreCaption.textContent = `Borrowed from ${key.label.replace(key.mode, key.mode === 'major' ? 'minor' : 'major')} (same tonic).`;
    elements.exploreGrid.replaceChildren(...chords.map(createTriadCard));
    return;
  }
  const { source, chords } = recommendationsForKey(key, chord);
  elements.exploreCaption.textContent = source
    ? `Diatonic chords to try after ${source}.`
    : `Start with these chords in ${key.label}.`;
  elements.exploreGrid.replaceChildren(...chords.map(createTriadCard));
}

function currentSnapshot() {
  if (preview) return { notes: preview.notes.map((midi) => ({ midi, state: 'held' })), pedal: false };
  return tracker.snapshot();
}

function renderNoteList(notes, chord) {
  elements.noteList.replaceChildren();
  if (!notes.length) {
    const placeholder = document.createElement('span');
    placeholder.className = 'note-placeholder';
    placeholder.textContent = 'No notes yet';
    elements.noteList.append(placeholder);
    return;
  }
  for (const note of notes) {
    const chip = document.createElement('span');
    chip.className = `note-chip${note.state === 'sustained' ? ' is-sustained' : ''}`;
    chip.textContent = spellMidiNote(note.midi, key, chord).label;
    if (note.state === 'sustained') chip.title = 'Held by the sustain pedal';
    elements.noteList.append(chip);
  }
}

function renderInversions(chord) {
  elements.inversionGrid.replaceChildren();
  const isLeftHand = chord?.quality === 'power' || chord?.quality === 'octave';
  const root = isLeftHand ? 48 + chord.rootPc : null;
  const leftHandForms = isLeftHand ? [
    { title: 'Root + fifth', notes: [root, root + 7] },
    { title: 'Root + octave', notes: [root, root + 12] },
    { title: 'Root + fifth + octave', notes: [root, root + 7, root + 12] },
  ] : null;
  const count = leftHandForms?.length || chord?.intervals.length || 3;
  const pianoStart = isLeftHand ? 48 : 60;
  const pianoEnd = isLeftHand ? 71 : 95;
  elements.inversionGrid.classList.toggle('is-four', count === 4);
  elements.inversionsHeading.textContent = isLeftHand ? 'Left-hand shapes'
    : count === 4 ? 'Four positions' : 'Three positions';
  if (isLeftHand) {
    elements.inversionCaption.textContent = `${chord.rootName.replace('b', '♭').replace('#', '♯')} in three common left-hand patterns.`;
  } else {
    elements.inversionCaption.textContent = chord
      ? `${chord.name} in root position and ${count === 4 ? 'three' : 'both'} inversions.`
      : 'Play a chord to see its inversions.';
  }

  const positions = ['Root position', 'First inversion', 'Second inversion', 'Third inversion'];
  for (let inversion = 0; inversion < count; inversion += 1) {
    const form = leftHandForms?.[inversion];
    const notes = form?.notes || (chord ? voicingForChord(chord, inversion) : []);
    const titleText = form?.title || positions[inversion];
    const card = document.createElement('div');
    card.className = 'panel form-card';
    const title = document.createElement('div');
    title.className = 'form-title';
    const name = document.createElement('span');
    name.textContent = titleText;
    const number = document.createElement('span');
    number.textContent = `0${inversion + 1}`;
    title.append(name, number);
    const noteLine = document.createElement('div');
    noteLine.className = 'form-notes';
    noteLine.textContent = notes.length
      ? notes.map((midi) => spellMidiNote(midi, key, chord).label).join(' · ')
      : '—';
    card.append(title, noteLine, createPiano(pianoStart, pianoEnd, notes, `${titleText} piano keys`));
    appendPianoRange(card, pianoStart, pianoEnd);
    elements.inversionGrid.append(card);
  }
}

function renderLive() {
  const { notes, pedal } = currentSnapshot();
  const midiNotes = notes.map((note) => note.midi);
  const chordMidiNotes = chordInputNotes(notes, splitNote, Boolean(preview)).map((note) => note.midi);
  const chord = preview?.chord || recognizeChordWithMelody(chordMidiNotes, key);
  const distinctPitches = new Set(chordMidiNotes.map((note) => note % 12)).size;

  elements.liveMode.textContent = preview ? `Preview: ${preview.name}`
    : selectedInput ? 'Live MIDI' : 'Waiting for MIDI';
  elements.clearPreview.hidden = !preview;
  elements.staffKeyLabel.textContent = key.label;
  elements.noteCount.textContent = `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`;
  elements.liveStaff.innerHTML = staffSvg(midiNotes, key, chord);
  renderNoteList(notes, chord);
  elements.pedalBadge.hidden = !pedal;

  if (chord) {
    elements.chordName.textContent = chord.displayName;
    elements.chordDetail.textContent = `${QUALITIES[chord.quality].label}${chord.bassPc !== chord.rootPc ? ' in inversion' : ''}${chord.pattern ? ` · ${chord.pattern}` : ''}${chord.inKey ? ' · in this key' : ' · outside this key'}${chord.ignoredUpperNotes ? ` · inferred from lower notes; ${chord.ignoredUpperNotes} higher ${chord.ignoredUpperNotes === 1 ? 'note' : 'notes'} ignored` : ''}.`;
    elements.degreeBadge.textContent = chord.inKey ? `${chord.degree ? `${chord.degree} · ` : ''}in key` : 'Outside key';
    elements.degreeBadge.hidden = false;
  } else {
    elements.chordName.textContent = '—';
    elements.chordDetail.textContent = !chordMidiNotes.length
      ? notes.length && splitNote !== null && !preview
        ? 'Play notes below the split key to identify a chord.'
        : 'Play an octave, a perfect fifth, or a chord.'
      : distinctPitches === 1
        ? 'Add a note one octave away to make an octave pair.'
        : distinctPitches === 2
          ? 'Try a perfect fifth or add a note to make a chord.'
        : distinctPitches > 4
          ? 'No clear chord in the lower notes. Try Learn split or release the sustain pedal.'
          : 'These notes do not match a supported chord.';
    elements.degreeBadge.hidden = true;
  }
  renderInversions(chord);
  renderExplore(chord);
}

function selectInput(input) {
  if (selectedInput) {
    selectedInput.onmidimessage = null;
    tracker.clearSource(selectedInput.id);
  }
  selectedInput = input;
  preview = null;
  keySamples = [];
  keySuggestions = [];
  if (selectedInput) {
    selectedInput.onmidimessage = (event) => {
      preview = null;
      const played = noteOnMidi(event.data);
      const learnedSplit = splitArmed && played !== null;
      if (splitArmed && played !== null) {
        splitNote = played;
        splitArmed = false;
        saveSplit();
        renderSplitStatus();
      }
      if (detectingKey && played !== null && !learnedSplit) {
        keySamples.push(played);
        keySamples = keySamples.slice(-64);
        keySuggestions = guessKeys(keySamples);
        renderKeyDetectionStatus();
      }
      if (tracker.receive(selectedInput.id, event.data)) {
        renderLive();
        renderTriads();
      }
    };
    setStatus(`Listening to ${selectedInput.name || 'MIDI input'}`, 'connected');
  } else {
    setStatus(access ? 'No MIDI input found. Connect a device to continue.' : 'Ready to connect');
  }
  renderSplitStatus();
  renderKeyDetectionStatus();
  renderLive();
  renderTriads();
}

function refreshInputs() {
  const inputs = [...access.inputs.values()].filter((input) => input.state === 'connected');
  const previousId = selectedInput?.id;
  const next = inputs.find((input) => input.id === previousId) || inputs[0] || null;
  elements.inputSelect.replaceChildren();
  if (!inputs.length) {
    const option = document.createElement('option');
    option.textContent = 'No MIDI inputs available';
    elements.inputSelect.append(option);
  } else {
    for (const input of inputs) {
      const option = document.createElement('option');
      option.value = input.id;
      option.textContent = input.name || `MIDI input ${inputs.indexOf(input) + 1}`;
      elements.inputSelect.append(option);
    }
    elements.inputSelect.value = next.id;
  }
  elements.inputSelect.disabled = inputs.length === 0;
  if (next?.id !== previousId) selectInput(next);
  else if (next) setStatus(`Listening to ${next.name || 'MIDI input'}`, 'connected');
  else setStatus('No MIDI input found. Connect a device to continue.');
  renderSplitStatus();
}

async function connectMidi() {
  if (!navigator.requestMIDIAccess) {
    setStatus('Web MIDI is unavailable in this browser. Use Chrome or another Web MIDI browser.', 'error');
    return;
  }
  elements.connectButton.disabled = true;
  elements.connectButton.textContent = 'Connecting…';
  setStatus('Requesting MIDI permission…');
  try {
    access = await navigator.requestMIDIAccess();
    access.onstatechange = refreshInputs;
    elements.connectButton.textContent = 'MIDI connected';
    refreshInputs();
  } catch (error) {
    elements.connectButton.disabled = false;
    elements.connectButton.textContent = 'Connect MIDI';
    setStatus(`MIDI access was not granted${error?.name ? ` (${error.name})` : ''}. Check browser permissions and try again.`, 'error');
  }
}

elements.keySelect.addEventListener('change', () => {
  detectingKey = false;
  keySamples = [];
  keySuggestions = [];
  renderKeyDetectionStatus();
  key = getKey(elements.keySelect.value);
  saveKey(key.id);
  preview = null;
  renderSplitStatus();
  renderTriads();
  renderLive();
});
elements.inputSelect.addEventListener('change', () => {
  selectInput(access.inputs.get(elements.inputSelect.value) || null);
});
elements.connectButton.addEventListener('click', connectMidi);
elements.detectKeyButton.addEventListener('click', () => {
  detectingKey = !detectingKey;
  if (detectingKey) {
    keySamples = [];
    keySuggestions = [];
  }
  renderKeyDetectionStatus();
});
elements.useDetectedKey.addEventListener('click', () => {
  if (!keySuggestions.length) return;
  key = keySuggestions[0];
  elements.keySelect.value = key.id;
  saveKey(key.id);
  detectingKey = false;
  keySamples = [];
  keySuggestions = [];
  preview = null;
  renderKeyDetectionStatus();
  renderSplitStatus();
  renderTriads();
  renderLive();
});
elements.splitButton.addEventListener('click', () => {
  splitArmed = !splitArmed;
  renderSplitStatus();
});
elements.clearSplit.addEventListener('click', () => {
  splitNote = null;
  splitArmed = false;
  saveSplit();
  renderSplitStatus();
  renderLive();
});
elements.clearPreview.addEventListener('click', () => {
  preview = null;
  renderTriads();
  renderLive();
});
elements.exploreOutOfKey.addEventListener('change', renderLive);

renderKeyOptions();
renderKeyDetectionStatus();
renderSplitStatus();
renderTriads();
renderLive();
if (!navigator.requestMIDIAccess) {
  elements.connectButton.disabled = true;
  setStatus('Web MIDI is unavailable here. Open the site in Chrome to connect a keyboard.', 'error');
}
