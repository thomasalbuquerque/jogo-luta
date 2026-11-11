import Phaser from 'phaser';
import { getCharacter } from '@jogo-luta/sim';
import { addAudioHint } from '../audio/unlock';
import { formatClock, resultText, stocksLabel } from '../render/hud';
import { KoBurstLayer } from '../render/koBurst';
import type { EdgePoint } from '../render/koEdge';
import { PLAYER_COLORS, type FightScene } from './FightScene';

const FONT = 'monospace';
/** O % cresce ao levar golpe e volta sozinho (até este tamanho). */
const DAMAGE_POP_MAX = 1.6;
const DAMAGE_POP_RATE = 9;

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
  private koBursts!: KoBurstLayer;
  /** Último % mostrado e tamanho atual do texto, por jogador. */
  private shownDamage: number[] = [];
  private pop: number[] = [];

  constructor() {
    super('hud');
  }

  create(): void {
    const { width, height } = this.scale;
    const fighters = (this.scene.get('fight') as FightScene).state.fighters;
    // por baixo do resto do HUD
    this.koBursts = new KoBurstLayer(this);
    addAudioHint(this);
    this.shownDamage = fighters.map((f) => f.damage);
    this.pop = fighters.map(() => 1);
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

  /** Explosão do KO na borda da tela (px de tela), na cor do jogador. */
  koBurst(at: EdgePoint, color: number): void {
    this.koBursts.spawn(at, color);
  }

  override update(_time: number, delta: number): void {
    const fight = this.scene.get('fight') as FightScene;
    const state = fight.state;
    this.koBursts.update(delta);
    for (const [i, panel] of this.panels.entries()) {
      const f = state.fighters[i];
      if (!f) continue;
      // levou dano: o % pula de tamanho, proporcional ao golpe
      const shown = this.shownDamage[i] ?? 0;
      let pop = this.pop[i] ?? 1;
      if (f.damage > shown) pop = Math.min(pop + 0.15 + (f.damage - shown) * 0.03, DAMAGE_POP_MAX);
      pop = 1 + (pop - 1) * Math.exp(-DAMAGE_POP_RATE * (delta / 1000));
      this.shownDamage[i] = f.damage;
      this.pop[i] = pop;
      panel.damage.setScale(pop);
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
