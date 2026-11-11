export function noteOnMidi(data) {
  return data?.length >= 3 && (data[0] & 0xf0) === 0x90 && data[2] > 0
    ? data[1] : null;
}

export function chordInputNotes(notes, splitNote, isPreview = false) {
  return isPreview || splitNote === null ? notes : notes.filter((note) => note.midi < splitNote);
}
