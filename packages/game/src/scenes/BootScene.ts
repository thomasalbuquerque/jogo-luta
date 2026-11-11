import Phaser from 'phaser';
import { PLAYABLE_CHARACTERS } from '@jogo-luta/sim';
import { characterAtlasPath, characterTextureKey } from '../render/FighterView';
import { createFxTextures } from '../render/fxTextures';
import { loadStages } from '../render/stageView';

/** Carrega a arte (atlas dos personagens e o cenário) e abre a primeira tela. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => {
      bar.clear();
      bar.fillStyle(0xffffff, 0.15);
      bar.fillRect(width * 0.3, height / 2 - 6, width * 0.4, 12);
      bar.fillStyle(0xffd166, 1);
      bar.fillRect(width * 0.3, height / 2 - 6, width * 0.4 * value, 12);
    });

    this.load.setPath(`${import.meta.env.BASE_URL}assets/`);
    for (const id of PLAYABLE_CHARACTERS) {
      const path = characterAtlasPath(id);
      this.load.atlas(characterTextureKey(id), `${path}.png`, `${path}.json`);
    }
    loadStages(this.load);
  }

  create(): void {
    createFxTextures(this);
    // Só em dev: ?rig abre o visualizador de animações.
    const viewer = import.meta.env.DEV && new URLSearchParams(location.search).has('rig');
    this.scene.start(viewer ? 'rig-viewer' : 'select');
  }
}
