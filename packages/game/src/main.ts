import Phaser from 'phaser';
import { setupAudio } from './audio/unlock';
import { RENDER_SCALE, RenderScalePlugin, VIEW } from './render/resolution';
import { BackdropScene } from './scenes/BackdropScene';
import { BootScene } from './scenes/BootScene';
import { ControlsScene } from './scenes/ControlsScene';
import { DebugScene } from './scenes/DebugScene';
import { FightScene } from './scenes/FightScene';
import { HudScene } from './scenes/HudScene';
import { NameScene } from './scenes/NameScene';
import { OnlineScene } from './scenes/OnlineScene';
import { PauseScene } from './scenes/PauseScene';
import { ResultScene } from './scenes/ResultScene';
import { RigViewerScene } from './scenes/RigViewerScene';
import { SelectScene } from './scenes/SelectScene';
import { StageSelectScene } from './scenes/StageSelectScene';
import { TitleScene } from './scenes/TitleScene';
import { TutorialScene } from './scenes/TutorialScene';
import { VolumeScene } from './scenes/VolumeScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  // o layout é em 1280×720 (VIEW); o canvas tem a resolução da tela (ver resolution.ts)
  width: Math.round(VIEW.width * RENDER_SCALE),
  height: Math.round(VIEW.height * RENDER_SCALE),
  backgroundColor: '#1d2333',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // mipmaps nas texturas de lado potência de 2 (os atlas do pnpm art): imagem
  // reduzida na tela (retrato, objeto, câmera afastada) fica lisa, sem serrilhado
  render: { mipmapFilter: 'LINEAR_MIPMAP_LINEAR' },
  plugins: {
    scene: [{ key: 'renderScale', plugin: RenderScalePlugin, mapping: 'renderScale' }],
  },
  // A primeira da lista começa sozinha: carrega a arte e abre a tela inicial.
  // A ordem é a de desenho: o fundo (backdrop) fica atrás dos menus, e pausa e
  // resultado ficam por cima do HUD.
  scene: [
    BootScene,
    BackdropScene,
    TitleScene,
    NameScene,
    OnlineScene,
    SelectScene,
    StageSelectScene,
    ControlsScene,
    FightScene,
    HudScene,
    TutorialScene,
    PauseScene,
    ResultScene,
    DebugScene,
    RigViewerScene,
    // barra de volume: começa sozinha e se mantém por cima de tudo
    VolumeScene,
  ],
});

setupAudio(game);

// Só em dev: permite inspecionar o jogo pelo console (window.__game).
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
