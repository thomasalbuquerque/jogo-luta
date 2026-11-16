import Phaser from 'phaser';
import { music } from './music';
import { VIEW } from '../render/view';
import {
  clampVolume,
  OLD_MUTE_STORAGE_KEY,
  parseVolume,
  VOLUME_STORAGE_KEY,
  volumeGain,
} from './volume';

/** Evento do jogo quando o volume muda (barra no alto da tela). */
export const VOLUME_CHANGED = 'volume-changed';

/**
 * Volume geral (0..1). Guardado aqui porque o `sound.volume` do Phaser lê o nó
 * do Web Audio, que só atualiza depois: ler logo após mudar devolve o valor antigo.
 */
let volume = 1;

export function getVolume(): number {
  return volume;
}

/** Muda o volume geral: aplica no som, guarda no navegador e avisa a barra. */
export function setVolume(game: Phaser.Game, value: number): void {
  const v = clampVolume(value);
  if (v === volume) return;
  volume = v;
  game.sound.volume = volumeGain(v);
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(v));
  } catch {
    // só não lembra na próxima vez
  }
  game.events.emit(VOLUME_CHANGED, v);
}

/**
 * Som do jogo: aplica o volume guardado no navegador e, quando o navegador
 * libera o áudio (1º clique ou tecla), começa a música que estava esperando.
 * Chamar 1 vez, com o jogo criado.
 */
export function setupAudio(game: Phaser.Game): void {
  game.events.once(Phaser.Core.Events.READY, () => {
    try {
      volume = parseVolume(
        localStorage.getItem(VOLUME_STORAGE_KEY),
        localStorage.getItem(OLD_MUTE_STORAGE_KEY),
      );
    } catch {
      // sem localStorage (aba privada): volume padrão
    }
    game.sound.volume = volumeGain(volume);
    game.events.emit(VOLUME_CHANGED, volume);
    game.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
      const scene = game.scene.getScenes(true)[0];
      if (scene) music.resume(scene);
    });
  });
}

/**
 * Aviso no alto da cena, centralizado em `y`, enquanto o navegador não libera o
 * áudio: "clique ou aperte uma tecla".
 */
export function addAudioHint(scene: Phaser.Scene, y = 12): void {
  const text = scene.add
    .text(VIEW.width / 2, y, '🔊 Clique ou aperte uma tecla para ligar o som', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 4 },
    })
    .setOrigin(0.5, 0)
    .setDepth(1000)
    .setScrollFactor(0);
  const pulse = scene.tweens.add({
    targets: text,
    alpha: 0.4,
    yoyo: true,
    repeat: -1,
    duration: 700,
    paused: true,
  });
  const refresh = () => {
    const locked = scene.sound.locked;
    text.setVisible(locked);
    if (locked) pulse.resume();
    else pulse.pause();
  };
  refresh();
  scene.sound.on(Phaser.Sound.Events.UNLOCKED, refresh);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.sound.off(Phaser.Sound.Events.UNLOCKED, refresh);
  });
}
