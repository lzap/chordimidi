export class MidiNoteTracker {
  constructor() {
    this.channels = new Map();
  }

  channel(source, number) {
    const key = `${source}:${number}`;
    if (!this.channels.has(key)) {
      this.channels.set(key, { source, held: new Map(), sustained: new Set(), pedal: false });
    }
    return this.channels.get(key);
  }

  receive(source, data) {
    if (!data || data.length < 2) return false;
    const type = data[0] & 0xf0;
    const number = data[0] & 0x0f;
    const note = data[1];
    const value = data[2] ?? 0;
    if (![0x80, 0x90, 0xb0].includes(type)) return false;
    const channel = this.channel(source, number);

    if (type === 0x90 && value > 0) {
      channel.held.set(note, (channel.held.get(note) || 0) + 1);
      channel.sustained.delete(note);
      return true;
    }
    if (type === 0x80 || (type === 0x90 && value === 0)) {
      const count = channel.held.get(note) || 0;
      if (count > 1) channel.held.set(note, count - 1);
      else if (count === 1) {
        channel.held.delete(note);
        if (channel.pedal) channel.sustained.add(note);
      }
      return true;
    }
    if (type === 0xb0 && note === 64) {
      const pedal = value >= 64;
      if (channel.pedal && !pedal) channel.sustained.clear();
      channel.pedal = pedal;
      return true;
    }
    if (type === 0xb0 && (note === 120 || note === 123)) {
      channel.held.clear();
      channel.sustained.clear();
      return true;
    }
    return false;
  }

  clearSource(source) {
    for (const [key, channel] of this.channels) {
      if (channel.source === source) this.channels.delete(key);
    }
  }

  clear() {
    this.channels.clear();
  }

  snapshot() {
    const combined = new Map();
    let pedal = false;
    for (const channel of this.channels.values()) {
      pedal ||= channel.pedal;
      for (const note of channel.sustained) {
        if (!combined.has(note)) combined.set(note, 'sustained');
      }
      for (const note of channel.held.keys()) combined.set(note, 'held');
    }
    const notes = [...combined].sort(([a], [b]) => a - b)
      .map(([midi, state]) => ({ midi, state }));
    return { notes, pedal };
  }
}
