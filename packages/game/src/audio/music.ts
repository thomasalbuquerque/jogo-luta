import Phaser from 'phaser';
import { MUSIC_SAMPLE_RATE, renderSong, SONGS, type TrackName } from './musicSynth';
import { addGeneratedAudio, audioContext } from './sfx';

/** Volume da música (os efeitos ficam por cima). */
const MUSIC_VOLUME = 0.32;
/** Duração da troca de faixa (fade), em ms. */
const FADE_MS = 600;

/** Chave do arquivo gravado (`audio/musica/<faixa>.*`) ou da faixa gerada. */
function trackKey(scene: Phaser.Scene, track: TrackName): string | null {
  const recorded = `musica/${track}`;
  if (scene.cache.audio.exists(recorded)) return recorded;
  const generated = `synth/musica/${track}`;
  if (!scene.cache.audio.exists(generated)) {
    if (!audioContext(scene)) return null;
    addGeneratedAudio(scene, generated, renderSong(SONGS[track]), MUSIC_SAMPLE_RATE);
  }
  return generated;
}

interface Fade {
  sound: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
  from: number;
  to: number;
  elapsed: number;
  stopAtEnd: boolean;
}

/**
 * Uma faixa por vez, com fade entre elas. Vive no jogo inteiro (não numa cena):
 * trocar de cena no meio do fade não deixa música tocando esquecida.
 */
class MusicPlayer {
  private current: { key: string; sound: Fade['sound'] } | null = null;
  private wanted: TrackName | null = null;
  private fades: Fade[] = [];
  private readonly volumes = new Map<Fade['sound'], number>();
  private game: Phaser.Game | null = null;

  play(scene: Phaser.Scene, track: TrackName): void {
    this.attach(scene.game);
    this.wanted = track;
    // Bloqueado pelo navegador: começa quando liberar (ver unlock.ts).
    if (scene.sound.locked) return;
    const key = trackKey(scene, track);
    if (!key || this.current?.key === key) return;
    if (this.current) this.fade(this.current.sound, 0, true);
    const sound = scene.sound.add(key, { loop: true, volume: 0 }) as Fade['sound'];
    sound.play();
    this.fade(sound, MUSIC_VOLUME, false);
    this.current = { key, sound };
  }

  /** Toca a faixa pedida antes do áudio ser liberado. */
  resume(scene: Phaser.Scene): void {
    if (this.wanted) this.play(scene, this.wanted);
  }

  /** Gera a faixa já (ex.: a da luta enquanto ainda está no menu), para não travar depois. */
  warm(scene: Phaser.Scene, track: TrackName): void {
    trackKey(scene, track);
  }

  private fade(sound: Fade['sound'], to: number, stopAtEnd: boolean): void {
    this.fades = this.fades.filter((f) => f.sound !== sound);
    // sound.volume lê o nó do Web Audio, que atrasa: usa o último valor que pusemos
    const from = this.volumes.get(sound) ?? 0;
    this.fades.push({ sound, from, to, elapsed: 0, stopAtEnd });
  }

  private attach(game: Phaser.Game): void {
    if (this.game === game) return;
    this.game = game;
    game.events.on(Phaser.Core.Events.STEP, (_time: number, delta: number) => {
      this.step(delta);
    });
  }

  private step(delta: number): void {
    for (const f of this.fades) {
      f.elapsed += delta;
      const k = Math.min(f.elapsed / FADE_MS, 1);
      const volume = f.from + (f.to - f.from) * k;
      f.sound.setVolume(volume);
      this.volumes.set(f.sound, volume);
      if (k >= 1 && f.stopAtEnd) {
        f.sound.destroy();
        this.volumes.delete(f.sound);
      }
    }
    this.fades = this.fades.filter((f) => f.elapsed < FADE_MS);
  }
}

export const music = new MusicPlayer();
