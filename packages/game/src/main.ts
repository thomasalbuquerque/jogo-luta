import Phaser from 'phaser';
import { DebugScene } from './scenes/DebugScene';
import { FightScene } from './scenes/FightScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#1d2333',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [FightScene, DebugScene],
});

// Só em dev: permite inspecionar o jogo pelo console (window.__game).
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
