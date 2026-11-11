import { characterOf, currentMove, moveFrame, type Fighter } from '@jogo-luta/sim';
import { movePhaseTime, sampleClip } from './animation';
import { clipFor } from './library';
import type { Pose } from './skeleton';

/** Hitstun a partir desta duração (ticks) é arremesso forte: o corpo gira no ar. */
export const TUMBLE_TICKS = 30;

/** Nome do clipe e tempo dele para o estado atual do lutador no sim. */
export function fighterClip(f: Fighter): { key: string; t: number } {
  switch (f.state) {
    case 'attack': {
      const move = currentMove(f);
      if (!move || !f.move) return { key: 'idle', t: f.stateTicks };
      return {
        key: f.move,
        t: movePhaseTime(moveFrame(f), move.startup, move.active, move.recovery),
      };
    }
    case 'hitstun':
      return { key: f.stateDuration >= TUMBLE_TICKS ? 'tumble' : 'hitstun', t: f.stateTicks };
    case 'ko':
      return { key: 'idle', t: 0 };
    default:
      return { key: f.state, t: f.stateTicks };
  }
}

/** Pose do lutador agora (o clipe certo, no tempo certo). */
export function fighterPose(f: Fighter): Pose {
  const { key, t } = fighterClip(f);
  return sampleClip(clipFor(characterOf(f), key), t);
}
