import Phaser from 'phaser';
import { Button, moveFrame, toPx, type ButtonName, type Fighter } from '@jogo-luta/sim';
import { DEBUG_KEY, type FightScene } from './FightScene';

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

/** Estado com o golpe e o frame dele, ou a duração do hitstun. */
function stateLabel(f: Fighter): string {
  if (f.state === 'attack' && f.move) return `${f.move} f${String(moveFrame(f))}`;
  if (f.state === 'hitstun') return `hitstun ${String(f.stateTicks)}/${String(f.stateDuration)}`;
  return f.state;
}

/**
 * Overlay de debug por cima da luta, com câmera própria (sem zoom). Tecla ` liga
 * e desliga o modo debug (este texto e as caixas de hitbox/hurtbox na luta).
 */
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
      this.registry.set(DEBUG_KEY, this.registry.get(DEBUG_KEY) !== true);
    });
  }

  override update(): void {
    const visible = this.registry.get(DEBUG_KEY) === true;
    this.text.setVisible(visible);
    if (!visible) return;
    const fight = this.scene.get('fight') as FightScene;
    const state = fight.state;
    const lines = [
      `FPS ${this.game.loop.actualFps.toFixed(0)}   tick ${String(state.tick)}`,
      ...state.fighters.map((f) => {
        const vx = toPx(f.vx + f.kbx)
          .toFixed(1)
          .padStart(6);
        const vy = toPx(f.vy + f.kby)
          .toFixed(1)
          .padStart(6);
        const flags = [
          f.grounded ? 'chão' : 'ar',
          `pulos ${String(f.airJumpsLeft)}`,
          f.recoveryUsed ? 'sem recup.' : '',
          f.airDodgeUsed ? 'sem dodge' : '',
          f.hitstop > 0 ? `hitstop ${String(f.hitstop)}` : '',
        ]
          .filter(Boolean)
          .join(' ');
        return `P${String(f.id + 1)} ${stateLabel(f).padEnd(18)} vx ${vx} vy ${vy}  ${flags}  [${inputLabel(fight.lastInputs[f.id] ?? 0)}]`;
      }),
      'P1: WASD, Espaço pula, V ataque, B especial, Shift esq. esquiva',
      'P2: setas, J pula, K ataque, L especial, I esquiva     ` debug',
    ];
    this.text.setText(lines);
  }
}
