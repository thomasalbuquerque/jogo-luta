import Phaser from 'phaser';
import type { Character } from '@jogo-luta/sim';
import { renderFanfare } from './fanfare';
import { addGeneratedAudio, audioContext } from './sfx';
import { renderKoYell } from './sfxSynth';
import { voiceNotes } from './voiceNotes';

/** Volume das vozes gravadas (áudio de WhatsApp costuma vir baixo). */
const VOICE_VOLUME = 1;

/**
 * Provocações que, sem o áudio gravado, tocam um instrumento sintetizado em vez
 * da voz provisória (o Tauba não fala: toca o trompete).
 */
const TAUNT_INSTRUMENTS: Readonly<
  Record<string, (sampleRate: number) => Float32Array<ArrayBuffer>>
> = { tauba_bordao: renderFanfare };

/** Chave de uma voz gravada: `audio/vozes/<id>.*`. */
export function voiceKey(sound: string): string {
  return `vozes/${sound}`;
}

/**
 * Toca a voz de uma provocação: o áudio gravado do amigo, se existir em
 * `audio/vozes/`; senão, o instrumento sintetizado dele (`TAUNT_INSTRUMENTS`) ou
 * uma voz provisória sintetizada a partir do bordão.
 */
export function playVoice(scene: Phaser.Scene, sound: string, text: string): void {
  if (scene.sound.locked) return;
  const key = voiceKey(sound);
  if (scene.cache.audio.exists(key)) {
    scene.sound.play(key, { volume: VOICE_VOLUME });
    return;
  }
  const instrument = TAUNT_INSTRUMENTS[sound];
  const ctx = audioContext(scene);
  if (instrument && ctx) {
    const synthKey = `synth/taunt/${sound}`;
    addGeneratedAudio(scene, synthKey, instrument(ctx.sampleRate), ctx.sampleRate);
    scene.sound.play(synthKey, { volume: 0.4 });
    return;
  }
  playSynthVoice(scene, text);
}

/** Voz no KO: o áudio gravado ou um grito sintetizado com o tom do personagem. */
export function playKoVoice(scene: Phaser.Scene, character: Character): void {
  if (scene.sound.locked) return;
  const key = voiceKey(character.koSound);
  if (scene.cache.audio.exists(key)) {
    scene.sound.play(key, { volume: VOICE_VOLUME });
    return;
  }
  const ctx = audioContext(scene);
  if (!ctx) return;
  const synthKey = `synth/ko/${character.id}`;
  addGeneratedAudio(scene, synthKey, renderKoYell(character.id, ctx.sampleRate), ctx.sampleRate);
  scene.sound.play(synthKey, { volume: 0.35 });
}

/** Bordão "cantado" com osciladores (sílaba = nota), tocado na hora. */
function playSynthVoice(scene: Phaser.Scene, text: string): void {
  const sound = scene.sound;
  if (!(sound instanceof Phaser.Sound.WebAudioSoundManager)) return;
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
    // pelo nó de mudo do Phaser: com M ligado, a voz também cala
    osc.connect(gain).connect(sound.masterMuteNode);
    osc.start(t);
    osc.stop(t + note.dur + 0.02);
    t += note.dur + 0.015;
  }
}
