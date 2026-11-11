import Phaser from 'phaser';
import { music } from './music';

/** Evento do jogo quando o mudo liga ou desliga (M). */
const MUTE_CHANGED = 'mute-changed';
const MUTE_STORAGE_KEY = 'jogo-luta:mudo';

/**
 * Mudo ligado. Guardado aqui porque o `sound.mute` do Phaser lê o nó do Web
 * Audio, que só atualiza depois: ler logo após mudar devolve o valor antigo.
 */
let muted = false;

export function isMuted(): boolean {
  return muted;
}

/**
 * Som do jogo: M liga/desliga o mudo (guardado no navegador) e, quando o
 * navegador libera o áudio (1º clique ou tecla), começa a música que estava
 * esperando. Chamar 1 vez, com o jogo criado.
 */
export function setupAudio(game: Phaser.Game): void {
  game.events.once(Phaser.Core.Events.READY, () => {
    try {
      muted = localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    } catch {
      // sem localStorage (aba privada): começa com som
    }
    game.sound.mute = muted;
    game.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
      const scene = game.scene.getScenes(true)[0];
      if (scene) music.resume(scene);
    });
  });
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyM' || e.repeat) return;
    muted = !muted;
    game.sound.mute = muted;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
    } catch {
      // só não lembra na próxima vez
    }
    game.events.emit(MUTE_CHANGED);
  });
}

/**
 * Aviso no alto da cena, centralizado em `y`: enquanto o navegador não libera o
 * áudio, "clique ou aperte uma tecla"; com o mudo ligado, "som desligado".
 */
export function addAudioHint(scene: Phaser.Scene, y = 12): void {
  const text = scene.add
    .text(scene.scale.width / 2, y, '', {
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
    text.setText(
      locked ? '🔊 Clique ou aperte uma tecla para ligar o som' : '🔇 Som desligado (M liga)',
    );
    text.setVisible(locked || muted);
    if (locked) pulse.resume();
    else {
      pulse.pause();
      text.setAlpha(1);
    }
  };
  refresh();
  scene.sound.on(Phaser.Sound.Events.UNLOCKED, refresh);
  scene.game.events.on(MUTE_CHANGED, refresh);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.sound.off(Phaser.Sound.Events.UNLOCKED, refresh);
    scene.game.events.off(MUTE_CHANGED, refresh);
  });
}
