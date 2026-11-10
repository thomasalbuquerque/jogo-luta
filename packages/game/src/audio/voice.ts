import Phaser from 'phaser';
import { voiceNotes } from './voiceNotes';

/**
 * Toca a voz de uma provocação: o áudio `key` se já foi carregado (Etapa 5);
 * senão, uma voz provisória sintetizada a partir do bordão.
 */
export function playVoice(scene: Phaser.Scene, key: string, text: string): void {
  if (scene.cache.audio.exists(key)) {
    scene.sound.play(key);
    return;
  }
  const sound = scene.sound;
  if (!(sound instanceof Phaser.Sound.WebAudioSoundManager) || sound.mute) return;
  const ctx = sound.context;
  if (ctx.state === 'suspended') void ctx.resume();
  let t = ctx.currentTime + 0.02;
  for (const note of voiceNotes(text)) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(note.freq, t);
    // escorrega um pouco o tom, para lembrar fala
    osc.frequency.linearRampToValueAtTime(note.freq * 0.9, t + note.dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + note.dur);
    osc.connect(gain).connect(sound.masterVolumeNode);
    osc.start(t);
    osc.stop(t + note.dur + 0.02);
    t += note.dur + 0.015;
  }
}
