import { describe, expect, it } from 'vitest';
import { createFighter, moveDef, startMove } from '@jogo-luta/sim';
import { fighterClip, TUMBLE_TICKS } from './fighterPose';

describe('clipe do lutador', () => {
  it('fora de golpe, é o estado do sim', () => {
    const f = createFighter(0, { x: 0, y: 0 }, 'schummaki');
    expect(fighterClip(f).key).toBe('fall');
    f.state = 'taunt';
    f.stateTicks = 12;
    expect(fighterClip(f)).toEqual({ key: 'taunt', t: 12 });
  });

  it('no golpe, é o golpe no tempo das fases', () => {
    const f = createFighter(0, { x: 0, y: 0 }, 'joao-frango');
    f.grounded = true;
    startMove(f, 'special', 0);
    const move = moveDef(f, 'special');
    // moveFrame = stateTicks + 1: este é o 1º frame ativo
    f.stateTicks = move.startup;
    const clip = fighterClip(f);
    expect(clip.key).toBe('special');
    expect(clip.t).toBe(1);
  });

  it('hitstun comprido vira o giro de arremessado', () => {
    const f = createFighter(0, { x: 0, y: 0 });
    f.state = 'hitstun';
    f.stateDuration = 10;
    expect(fighterClip(f).key).toBe('hitstun');
    f.stateDuration = TUMBLE_TICKS;
    expect(fighterClip(f).key).toBe('tumble');
  });
});
