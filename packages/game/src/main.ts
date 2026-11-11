import Phaser from 'phaser';
import { setupAudio } from './audio/unlock';
import { BackdropScene } from './scenes/BackdropScene';
import { BootScene } from './scenes/BootScene';
import { ControlsScene } from './scenes/ControlsScene';
import { DebugScene } from './scenes/DebugScene';
import { FightScene } from './scenes/FightScene';
import { HudScene } from './scenes/HudScene';
import { PauseScene } from './scenes/PauseScene';
import { ResultScene } from './scenes/ResultScene';
import { RigViewerScene } from './scenes/RigViewerScene';
import { SelectScene } from './scenes/SelectScene';
import { StageSelectScene } from './scenes/StageSelectScene';
import { TitleScene } from './scenes/TitleScene';

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
  // A primeira da lista começa sozinha: carrega a arte e abre a tela inicial.
  // A ordem é a de desenho: o fundo (backdrop) fica atrás dos menus, e pausa e
  // resultado ficam por cima do HUD.
  scene: [
    BootScene,
    BackdropScene,
    TitleScene,
    SelectScene,
    StageSelectScene,
    ControlsScene,
    FightScene,
    HudScene,
    PauseScene,
    ResultScene,
    DebugScene,
    RigViewerScene,
  ],
});

setupAudio(game);

// Só em dev: permite inspecionar o jogo pelo console (window.__game).
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
