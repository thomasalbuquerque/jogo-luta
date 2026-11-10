import Phaser from 'phaser';
import { getCharacter } from '@jogo-luta/sim';
import { formatClock, resultText, stocksLabel } from '../render/hud';
import { PLAYER_COLORS, type FightScene } from './FightScene';

const FONT = 'monospace';

function cssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * HUD mínimo por cima da luta, com câmera própria (sem zoom): % de dano e
 * stocks de cada um, tempo e resultado. O HUD completo vem na Etapa 6.
 */
export class HudScene extends Phaser.Scene {
  private panels: { damage: Phaser.GameObjects.Text; stocks: Phaser.GameObjects.Text }[] = [];
  private clock!: Phaser.GameObjects.Text;
  private result!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super('hud');
  }

  create(): void {
    const { width, height } = this.scale;
    const fighters = (this.scene.get('fight') as FightScene).state.fighters;
    this.panels = [0, 1].map((i) => {
      const x = i === 0 ? width * 0.3 : width * 0.7;
      const color = cssColor(PLAYER_COLORS[i] ?? 0xffffff);
      const fighter = fighters[i];
      const name = fighter ? getCharacter(fighter.character).name.toUpperCase() : '';
      this.add
        .text(x, height - 104, `P${String(i + 1)}  ${name}`, {
          fontFamily: FONT,
          fontSize: '20px',
          fontStyle: 'bold',
          color,
        })
        .setOrigin(0.5);
      const damage = this.add
        .text(x, height - 66, '0%', {
          fontFamily: FONT,
          fontSize: '44px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 6,
        })
        .setOrigin(0.5);
      const stocks = this.add
        .text(x, height - 28, '', { fontFamily: FONT, fontSize: '22px', color })
        .setOrigin(0.5);
      return { damage, stocks };
    });
    this.clock = this.add
      .text(width - 20, 14, '', {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(1, 0);
    this.result = this.add
      .text(width / 2, height / 2 - 40, '', {
        fontFamily: FONT,
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 10,
      })
      .setOrigin(0.5);
    this.hint = this.add
      .text(
        width / 2,
        height / 2 + 30,
        'Ataque, Pulo ou Enter: revanche · Especial ou Esc: trocar lutador',
        {
          fontFamily: FONT,
          fontSize: '24px',
          color: '#e9ecef',
          stroke: '#000000',
          strokeThickness: 5,
        },
      )
      .setOrigin(0.5);
  }

  override update(): void {
    const fight = this.scene.get('fight') as FightScene;
    const state = fight.state;
    for (const [i, panel] of this.panels.entries()) {
      const f = state.fighters[i];
      if (!f) continue;
      panel.damage.setText(`${String(f.damage)}%`);
      panel.stocks.setText(stocksLabel(f.stocks, state.rules.stocks));
      panel.damage.setAlpha(f.state === 'ko' ? 0.4 : 1);
    }
    if (state.suddenDeath) {
      this.clock.setText('MORTE SÚBITA');
    } else {
      this.clock.setText(state.rules.timeLimitTicks > 0 ? formatClock(state.timeLeft) : '');
    }
    const over = state.phase === 'over';
    this.result.setVisible(over).setText(over ? resultText(state) : '');
    if (over && state.winner !== null) {
      this.result.setColor(cssColor(PLAYER_COLORS[state.winner] ?? 0xffffff));
    } else {
      this.result.setColor('#ffffff');
    }
    this.hint.setVisible(fight.canRematch());
  }
}
