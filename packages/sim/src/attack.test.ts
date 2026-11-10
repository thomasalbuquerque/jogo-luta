import { describe, expect, it } from 'vitest';
import { px } from './constants';
import { createFighter, DEFAULT_STATS, moveFrame, stepFighter, type Fighter } from './fighter';
import { Button } from './input';
import { MOVES, totalFrames } from './moves';
import type { Solid } from './physics';

const { LEFT, UP, DOWN, JUMP, ATTACK, SPECIAL, DODGE } = Button;

const solids: Solid[] = [{ kind: 'solid', x: px(-1000), y: 0, w: px(2000), h: px(500) }];

function run(f: Fighter, input: number, ticks = 1): void {
  for (let i = 0; i < ticks; i++) stepFighter(f, input, solids);
}

function onGround(x = 0): Fighter {
  const f = createFighter(0, { x: px(x), y: 0 });
  run(f, 0, 2);
  return f;
}

/** No alto, caindo, longe do chão. */
function inAir(): Fighter {
  const f = createFighter(0, { x: 0, y: px(-600) });
  run(f, 0, 2);
  return f;
}

describe('ataques', () => {
  it('leve neutro: attack durante os frames do golpe, depois volta a idle', () => {
    const f = onGround();
    run(f, ATTACK);
    expect(f.state).toBe('attack');
    expect(f.move).toBe('neutralLight');
    expect(moveFrame(f)).toBe(1);
    run(f, 0, totalFrames(MOVES.neutralLight) - 1);
    expect(f.state).toBe('attack');
    run(f, 0);
    expect(f.state).toBe('idle');
    expect(f.move).toBeNull();
  });

  it('golpe no chão para o lutador e não vira', () => {
    const f = onGround();
    run(f, ATTACK);
    run(f, LEFT, 5);
    expect(f.facing).toBe(1);
    expect(f.vx).toBe(0);
  });

  it('golpe com canWalk deixa andar no chão, sem virar', () => {
    const move = MOVES.neutralLight;
    move.canWalk = true;
    try {
      const f = onGround();
      run(f, ATTACK);
      run(f, LEFT, 5);
      expect(f.state).toBe('attack');
      expect(f.facing).toBe(1);
      expect(f.vx).toBeLessThan(0);
    } finally {
      move.canWalk = false;
    }
  });

  it('leve lado vira para o lado apertado e avança', () => {
    const f = onGround();
    const x0 = f.x;
    run(f, LEFT | ATTACK);
    expect(f.move).toBe('sideLight');
    expect(f.facing).toBe(-1);
    run(f, LEFT, totalFrames(MOVES.sideLight));
    expect(f.x).toBeLessThan(x0 - px(20));
  });

  it('aéreo que pousa no meio vira landing lag e depois idle', () => {
    const f = createFighter(0, { x: 0, y: px(-30) });
    run(f, ATTACK);
    expect(f.move).toBe('neutralAir');
    let guard = 0;
    while (f.state === 'attack') {
      run(f, 0);
      if (++guard > 60) throw new Error('não pousou');
    }
    expect(f.state).toBe('landing');
    expect(f.grounded).toBe(true);
    run(f, ATTACK); // ataque guardado durante o landing lag
    run(f, 0, MOVES.neutralAir.landingLag);
    expect(f.state).toBe('attack');
    expect(f.move).toBe('neutralLight');
  });

  it('aéreo no ar mira com ←/→ mas não vira', () => {
    const f = inAir();
    run(f, ATTACK);
    run(f, LEFT, 8);
    expect(f.facing).toBe(1);
    expect(f.vx).toBeLessThan(0);
  });

  it('pulo e ataque no mesmo tick: pula e solta o aéreo no tick seguinte', () => {
    const f = onGround();
    run(f, JUMP | ATTACK);
    expect(f.state).toBe('jump');
    run(f, JUMP | ATTACK);
    expect(f.state).toBe('attack');
    expect(f.move).toBe('neutralAir');
  });

  it('recuperação: sobe, só 1 vez por ar; depois ↑ + Ataque vira aéreo neutro', () => {
    const f = inAir();
    const y0 = f.y;
    run(f, UP | ATTACK);
    expect(f.move).toBe('recovery');
    expect(f.recoveryUsed).toBe(true);
    run(f, 0, 10);
    expect(f.y).toBeLessThan(y0);
    run(f, 0, totalFrames(MOVES.recovery));
    expect(f.state).not.toBe('attack');
    run(f, UP | ATTACK);
    expect(f.move).toBe('neutralAir');
    run(f, 0, 200);
    expect(f.grounded).toBe(true);
    expect(f.recoveryUsed).toBe(false);
  });

  it('ground pound: para no ar, cai reto e acerta ao pousar', () => {
    const f = inAir();
    run(f, DOWN | SPECIAL);
    expect(f.move).toBe('groundPound');
    const y0 = f.y;
    run(f, 0, MOVES.groundPound.startup - 1);
    expect(f.y).toBe(y0);
    run(f, 0);
    expect(f.vy).toBe(MOVES.groundPound.fallSpeed);
    let guard = 0;
    while (f.move === 'groundPound') {
      run(f, 0);
      if (++guard > 60) throw new Error('não pousou');
    }
    expect(f.grounded).toBe(true);
    expect(f.move).toBe('groundPoundLand');
    expect(moveFrame(f)).toBe(1);
  });

  it('Especial no chão não faz nada por enquanto', () => {
    const f = onGround();
    run(f, SPECIAL);
    expect(f.state).toBe('idle');
  });

  it('dash no chão pode sair em ataque', () => {
    const f = onGround();
    run(f, DODGE);
    expect(f.state).toBe('dash');
    run(f, ATTACK);
    expect(f.state).toBe('attack');
    expect(f.move).toBe('neutralLight');
  });

  it('nada de ataque durante o dodge aéreo', () => {
    const f = inAir();
    run(f, DODGE);
    run(f, ATTACK);
    expect(f.state).toBe('dodge');
    // o aperto guardado expira antes de o dodge acabar
    run(f, 0, DEFAULT_STATS.airDodgeTicks);
    expect(f.state).not.toBe('attack');
  });
});
