import Phaser from 'phaser';
import { Button, toPx, type ButtonName } from '@jogo-luta/sim';
import type { FightScene } from './FightScene';

const BUTTON_LABELS: Record<ButtonName, string> = {
  LEFT: '←',
  RIGHT: '→',
  UP: '↑',
  DOWN: '↓',
  JUMP: 'P',
  ATTACK: 'A',
  SPECIAL: 'E',
  DODGE: 'D',
  TAUNT: 'T',
};

function inputLabel(mask: number): string {
  return (Object.keys(Button) as ButtonName[])
    .map((name) => (mask & Button[name] ? BUTTON_LABELS[name] : '·'))
    .join('');
}

/** Overlay de debug por cima da luta, com câmera própria (sem zoom). Tecla ` liga/desliga. */
export class DebugScene extends Phaser.Scene {
  private text!: Phaser.GameObjects.Text;

  constructor() {
    super('debug');
  }

  create(): void {
    this.text = this.add.text(12, 10, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#e9ecef',
      backgroundColor: '#00000099',
      padding: { x: 8, y: 6 },
    });
    this.input.keyboard?.on('keydown-BACKTICK', () => {
      this.text.setVisible(!this.text.visible);
    });
  }

  override update(): void {
    if (!this.text.visible) return;
    const fight = this.scene.get('fight') as FightScene;
    const state = fight.state;
    const lines = [
      `FPS ${this.game.loop.actualFps.toFixed(0)}   tick ${String(state.tick)}`,
      ...state.fighters.map((f) => {
        const vx = toPx(f.vx).toFixed(1).padStart(6);
        const vy = toPx(f.vy).toFixed(1).padStart(6);
        const flags = [
          f.grounded ? 'chão' : 'ar',
          `pulos ${String(f.airJumpsLeft)}`,
          f.fastFalling ? 'fastfall' : '',
          f.airDodgeUsed ? 'sem dodge' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return `P${String(f.id + 1)} ${f.state.padEnd(9)} vx ${vx} vy ${vy}  ${flags}  [${inputLabel(fight.lastInputs[f.id] ?? 0)}]`;
      }),
      'P1: WASD, C pula, F esquiva   P2: setas, J pula, I esquiva   ` debug',
    ];
    this.text.setText(lines);
  }
}
