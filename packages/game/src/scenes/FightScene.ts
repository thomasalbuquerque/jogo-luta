import Phaser from 'phaser';
import { TICK_RATE } from '@jogo-luta/sim';

/** Cena vazia da Etapa 0: só prova que Phaser + sim estão ligados. */
export class FightScene extends Phaser.Scene {
  constructor() {
    super('fight');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, `Jogo de luta\nsim a ${String(TICK_RATE)} ticks/s`, {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
