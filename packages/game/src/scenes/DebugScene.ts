import Phaser from 'phaser';
import {
  Button,
  getCharacter,
  hashState,
  moveFrame,
  replayLength,
  TICK_MS,
  toPx,
  type ButtonName,
  type Fighter,
} from '@jogo-luta/sim';
import { delayLabel } from '../input/delay';
import { pingLabel } from '../net/ping';
import { fighterClip } from '../rig/fighterPose';
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
 * Com o debug ligado, 1/2 e 3/4 diminuem/aumentam o atraso de input do P1 e do
 * P2 (simula o netcode por atraso sem rede).
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
    const delayKeys: [string, number, number][] = [
      ['ONE', 0, -1],
      ['TWO', 0, 1],
      ['THREE', 1, -1],
      ['FOUR', 1, 1],
    ];
    for (const [key, player, step] of delayKeys) {
      this.input.keyboard?.on(`keydown-${key}`, () => {
        if (this.registry.get(DEBUG_KEY) !== true) return;
        const delay = this.fight.inputDelay;
        delay.setDelay(player, delay.getDelay(player) + step);
      });
    }
  }

  private get fight(): FightScene {
    return this.scene.get('fight') as FightScene;
  }

  /** Assistindo a um replay: em que tick está e, no fim, se reproduziu a gravação. */
  private replayLabel(): string {
    const fight = this.fight;
    if (!fight.playback) return '';
    const length = replayLength(fight.playback);
    const check =
      fight.replayOk === null
        ? ''
        : fight.replayOk
          ? ' igual à gravação'
          : ' DIFERENTE da gravação';
    return `   REPLAY ${String(Math.min(fight.state.tick, length))}/${String(length)}${check}`;
  }

  /** Online: a sala, a conexão e as filas do lockstep. */
  private netLabel(): string[] {
    const net = this.fight.net;
    if (!net) return [];
    const match = this.fight.onlineMatch;
    const parts = [
      `online ${net.role} sala ${net.code} P${String(net.local + 1)} de ${String(net.players)}`,
      net.status,
      `${pingLabel(net.ping.rtt)} ±${net.ping.jitter.toFixed(0)}`,
      net.route ?? 'rota ?',
    ];
    if (match) {
      const desync = match.desync.first;
      parts.push(
        `atraso ${delayLabel(match.delay, TICK_MS)}`,
        `folga ${String(match.lockstep.remoteLead)}`,
        `sem confirmar ${String(match.lockstep.unacked)}`,
        desync
          ? `DESSINCRONIZOU no tick ${String(desync.tick)} (P${String(desync.player + 1)})`
          : `hashes ok ${String(match.desync.checked)}`,
      );
    }
    return [parts.join('   ')];
  }

  override update(): void {
    const visible = this.registry.get(DEBUG_KEY) === true;
    this.text.setVisible(visible);
    if (!visible) return;
    const fight = this.fight;
    const state = fight.state;
    const hash = hashState(state).toString(16).padStart(8, '0');
    const delays = state.fighters
      .map((f) => `P${String(f.id + 1)} ${delayLabel(fight.inputDelay.getDelay(f.id), TICK_MS)}`)
      .join('   ');
    const lines = [
      ...this.netLabel(),
      `FPS ${this.game.loop.actualFps.toFixed(0)}   tick ${String(state.tick)}   hash ${hash}   seed ${String(fight.seed)}${this.replayLabel()}`,
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
          f.specialCooldown > 0 ? `recarga ${String(f.specialCooldown)}` : '',
          f.buffTicks > 0 ? `buff ${String(f.buffTicks)}` : '',
          f.grabTicks > 0 ? `segurando ${String(f.grabTicks)}` : '',
        ]
          .filter(Boolean)
          .join(' ');
        const c = getCharacter(f.character);
        // clipe que está tocando e o tempo dele (golpe: 0-1 startup, 1-2 active, 2-3 recovery)
        const clip = fighterClip(f);
        const anim = `${clip.key} ${clip.t.toFixed(f.state === 'attack' ? 2 : 0)}`;
        return `P${String(f.id + 1)} ${c.name.padEnd(12)} ${stateLabel(f).padEnd(18)} ${anim.padEnd(26)} vx ${vx} vy ${vy}  ${flags}  [${inputLabel(fight.lastInputs[f.id] ?? 0)}]`;
      }),
      'P1: WASD, Espaço pula, V ataque, B especial, Shift esq. esquiva, R provoca',
      'P2: setas, J pula, K ataque, L especial, I esquiva, U provoca     ` debug',
      `atraso de input  ${delays}     1/2: P1 −/+   3/4: P2 −/+`,
    ];
    this.text.setText(lines);
  }
}
