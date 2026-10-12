export const DEFAULT_ORDER_SOUND_VOLUME = 0.8;

export function orderSoundVolume(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : DEFAULT_ORDER_SOUND_VOLUME;
}

type SoundContext = Pick<AudioContext, "currentTime" | "destination" | "createGain" | "createOscillator">;
export type OrderSoundPlayback = { stop(): void; setVolume(volume: number): void };

/** Three soft ding/dong pairs, lasting three seconds. A separate master gain
 * keeps the user's volume live without changing each note's attack/release. */
export function playOrderSound(context: SoundContext, volume: number): OrderSoundPlayback {
  const master = context.createGain();
  master.gain.setValueAtTime(orderSoundVolume(volume), context.currentTime);
  master.connect(context.destination);
  const voices: { oscillator: OscillatorNode; envelope: GainNode; ended: boolean }[] = [];
  let remaining = 6;
  let stopped = false;
  const start = context.currentTime;

  for (let pair = 0; pair < 3; pair++) {
    for (let note = 0; note < 2; note++) {
      const at = start + pair + note * 0.45;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(note === 0 ? 880 : 659.25, at);
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(0.55, at + 0.025);
      envelope.gain.exponentialRampToValueAtTime(0.001, at + 0.5);
      envelope.gain.linearRampToValueAtTime(0, at + 0.54);
      oscillator.connect(envelope);
      envelope.connect(master);
      const voice = { oscillator, envelope, ended: false };
      voices.push(voice);
      oscillator.onended = () => {
        if (voice.ended) return;
        voice.ended = true;
        oscillator.disconnect();
        envelope.disconnect();
        if (--remaining === 0) master.disconnect();
      };
      oscillator.start(at);
      oscillator.stop(at + 0.55);
    }
  }

  const setVolume = (next: number) => {
    if (stopped || remaining === 0) return;
    const at = context.currentTime;
    master.gain.cancelScheduledValues(at);
    master.gain.setValueAtTime(master.gain.value, at);
    master.gain.linearRampToValueAtTime(orderSoundVolume(next), at + 0.02);
  };

  return {
    setVolume,
    stop() {
      if (stopped || remaining === 0) return;
      setVolume(0);
      stopped = true;
      // A short fade avoids clicking; pending notes are stopped before starting.
      for (const { oscillator, ended } of voices) if (!ended) oscillator.stop(context.currentTime + 0.025);
    },
  };
}
