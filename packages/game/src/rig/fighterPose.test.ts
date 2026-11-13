import { describe, expect, it } from 'vitest';
import { createFighter, moveDef, startMove } from '@jogo-luta/sim';
import { fighterClip, TUMBLE_TICKS } from './fighterPose';
import { COMBO_KEY, COUNTER_KEY } from './library';

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

  it('contra-ataque que pegou alguém toca o golpe devolvido', () => {
    const f = createFighter(0, { x: 0, y: 0 }, 'crocko');
    f.grounded = true;
    startMove(f, 'special', 0);
    const move = moveDef(f, 'special');
    // o sim pulou para o 1º frame do recovery
    f.stateTicks = move.startup + move.active;
    expect(fighterClip(f).key).toBe('special');
    f.moveHits = 1 << 1;
    const clip = fighterClip(f);
    expect(clip.key).toBe(COUNTER_KEY);
    expect(clip.t).toBeGreaterThan(2);
    // golpe que não é contra-ataque continua o mesmo clipe depois de acertar
    const g = createFighter(0, { x: 0, y: 0 }, 'schummaki');
    g.grounded = true;
    startMove(g, 'special', 0);
    g.moveHits = 1 << 1;
    expect(fighterClip(g).key).toBe('special');
  });

  it('agarrão com combo que pegou: o combo em ticks do agarrão e, depois, o recovery', () => {
    const f = createFighter(0, { x: 0, y: 0 }, 'meia');
    f.grounded = true;
    startMove(f, 'special', 0);
    const move = moveDef(f, 'special');
    const hold = move.grab?.holdTicks ?? 0;
    f.stateTicks = move.startup;
    // ainda não pegou: o especial
    expect(fighterClip(f).key).toBe('special');
    // pegou e já passaram 12 ticks segurando
    f.moveHits = 1 << 1;
    f.grabTicks = hold - 12;
    expect(fighterClip(f)).toEqual({ key: COMBO_KEY, t: 12 });
    // arremessou: o sim pulou para o recovery, que segue o combo
    f.grabTicks = 0;
    f.stateTicks = move.startup + move.active + 4;
    expect(fighterClip(f)).toEqual({ key: COMBO_KEY, t: hold + 5 });
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
