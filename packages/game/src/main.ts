import Phaser from 'phaser';
import { setupAudio } from './audio/unlock';
import { BootScene } from './scenes/BootScene';
import { DebugScene } from './scenes/DebugScene';
import { FightScene } from './scenes/FightScene';
import { HudScene } from './scenes/HudScene';
import { RigViewerScene } from './scenes/RigViewerScene';
import { SelectScene } from './scenes/SelectScene';

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
  // A primeira da lista começa sozinha: carrega a arte e abre a seleção.
  scene: [BootScene, SelectScene, FightScene, HudScene, DebugScene, RigViewerScene],
});

setupAudio(game);

// Só em dev: permite inspecionar o jogo pelo console (window.__game).
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
