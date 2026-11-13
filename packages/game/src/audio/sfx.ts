import Phaser from 'phaser';
import { renderSfx, SFX_NAMES, type SfxName } from './sfxSynth';

/** Volume de cada efeito (0..1), antes do volume geral. */
const VOLUME: Readonly<Record<SfxName, number>> = {
  hit_light: 0.55,
  hit_medium: 0.7,
  hit_heavy: 0.8,
  swing: 0.22,
  jump: 0.25,
  air_jump: 0.25,
  dash: 0.3,
  dodge: 0.35,
  land: 0.3,
  grab: 0.5,
  counter: 0.6,
  ko: 1,
  respawn: 0.45,
  vanish: 0.4,
  appear: 0.4,
  rifle_shot: 0.75,
  rifle_bolt: 0.4,
  spine_crack: 0.6,
  count: 0.45,
  go: 0.6,
  ui_move: 0.18,
  ui_confirm: 0.3,
  ui_back: 0.25,
  ui_error: 0.3,
};

/** Variação aleatória de tom em cada toque (cents), para não soar repetido. */
const DETUNE_SPREAD = 160;
/** Sons que tocam sempre no mesmo tom (contagem e menus). */
const STEADY: ReadonlySet<SfxName> = new Set([
  'vanish',
  'appear',
  'count',
  'go',
  'ui_move',
  'ui_confirm',
  'ui_back',
  'ui_error',
]);

export function sfxKey(name: SfxName): string {
  return `sfx/${name}`;
}

/** Contexto do Web Audio do jogo (null sem Web Audio: aí não há som gerado). */
export function audioContext(scene: Phaser.Scene): AudioContext | null {
  const sound = scene.sound;
  return sound instanceof Phaser.Sound.WebAudioSoundManager ? sound.context : null;
}

/** Amostras geradas → AudioBuffer mono, pronto para o cache de áudio do Phaser. */
export function addGeneratedAudio(
  scene: Phaser.Scene,
  key: string,
  samples: Float32Array<ArrayBuffer>,
  sampleRate: number,
): boolean {
  const ctx = audioContext(scene);
  if (!ctx || scene.cache.audio.exists(key)) return false;
  const buffer = ctx.createBuffer(1, samples.length, sampleRate);
  buffer.copyToChannel(samples, 0);
  scene.cache.audio.add(key, buffer);
  return true;
}

/** Gera os efeitos que não vieram de arquivo (`audio/sfx/<nome>.*`). Chamar 1 vez no boot. */
export function prepareSfx(scene: Phaser.Scene): void {
  const ctx = audioContext(scene);
  if (!ctx) return;
  for (const name of SFX_NAMES) {
    if (scene.cache.audio.exists(sfxKey(name))) continue;
    addGeneratedAudio(scene, sfxKey(name), renderSfx(name, ctx.sampleRate), ctx.sampleRate);
  }
}

export interface SfxOptions {
  /** Multiplica o volume do efeito. */
  volume?: number;
  /** Desloca o tom (cents), além da variação aleatória. */
  detune?: number;
}

/** Toca um efeito. Com o áudio ainda bloqueado pelo navegador, não toca (nem acumula). */
export function playSfx(scene: Phaser.Scene, name: SfxName, opts: SfxOptions = {}): void {
  const key = sfxKey(name);
  if (scene.sound.locked || !scene.cache.audio.exists(key)) return;
  scene.sound.play(key, {
    volume: VOLUME[name] * (opts.volume ?? 1),
    detune: (opts.detune ?? 0) + (STEADY.has(name) ? 0 : (Math.random() - 0.5) * DETUNE_SPREAD),
  });
}
