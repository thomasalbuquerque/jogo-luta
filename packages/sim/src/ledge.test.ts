import { describe, expect, it } from 'vitest';
import { px } from './constants';
import {
  createFighter,
  LEDGE_HANG_Y,
  LEDGE_MIN_TICKS,
  LEDGE_REGRAB_TICKS,
  stepFighter,
  type Fighter,
} from './fighter';
import { Button } from './input';
import type { Solid } from './physics';

const { LEFT, RIGHT, UP, DOWN, JUMP } = Button;

/** Palco de -450 a 450 px com topo em y=0, como o mapa de teste. */
const solids: Solid[] = [{ kind: 'solid', x: px(-450), y: 0, w: px(900), h: px(420) }];

function run(f: Fighter, input: number, ticks = 1): void {
  for (let i = 0; i < ticks; i++) stepFighter(f, input, solids);
}

/** Lutador caindo logo à esquerda da quina esquerda, com as mãos perto dela. */
function nearLeftLedge(): Fighter {
  // pés em 62 px → topo em -34 px, 20 px acima da posição pendurada
  const f = createFighter(0, { x: px(-450 - 24 - 5), y: px(62) });
  f.airJumpsLeft = 0;
  f.recoveryUsed = true;
  return f;
}

describe('borda (ledge)', () => {
  it('agarra a quina ao cair do lado dela e recupera pulo e recuperação', () => {
    const f = nearLeftLedge();
    run(f, 0);
    expect(f.state).toBe('ledge');
    expect(f.facing).toBe(1);
    expect(f.x + f.w).toBe(px(-450));
    expect(f.y).toBe(-LEDGE_HANG_Y);
    expect(f.airJumpsLeft).toBe(1);
    expect(f.recoveryUsed).toBe(false);
    run(f, 0, 100);
    expect(f.state).toBe('ledge'); // fica pendurado
  });

  it('agarra a quina direita virado para a esquerda', () => {
    const f = createFighter(0, { x: px(450 + 24 + 5), y: px(62) });
    run(f, 0);
    expect(f.state).toBe('ledge');
    expect(f.facing).toBe(-1);
    expect(f.x).toBe(px(450));
  });

  it('segurando ↓ não agarra', () => {
    const f = nearLeftLedge();
    run(f, DOWN, 10);
    expect(f.state).not.toBe('ledge');
  });

  it('subindo não agarra', () => {
    const f = nearLeftLedge();
    f.vy = px(-8);
    run(f, 0);
    expect(f.state).not.toBe('ledge');
  });

  it('na direção do palco sobe e fica em pé na beirada', () => {
    const f = nearLeftLedge();
    run(f, 0);
    run(f, RIGHT, LEDGE_MIN_TICKS);
    expect(f.grounded).toBe(true);
    expect(f.x).toBe(px(-450));
    expect(f.y + f.h).toBe(0);
  });

  it('↑ também sobe, mas só depois do tempo mínimo pendurado', () => {
    const f = nearLeftLedge();
    run(f, 0);
    run(f, UP, LEDGE_MIN_TICKS - 2);
    expect(f.state).toBe('ledge');
    run(f, UP, 2);
    expect(f.grounded).toBe(true);
  });

  it('pulo sai da borda subindo, com o pulo aéreo guardado', () => {
    const f = nearLeftLedge();
    run(f, 0, LEDGE_MIN_TICKS);
    run(f, JUMP);
    expect(f.state).toBe('jump');
    expect(f.vy).toBeLessThan(0);
    expect(f.airJumpsLeft).toBe(1);
  });

  it('para fora solta e não reagarra logo em seguida', () => {
    const f = nearLeftLedge();
    run(f, 0, LEDGE_MIN_TICKS);
    run(f, LEFT);
    expect(f.state).toBe('fall');
    run(f, 0, LEDGE_REGRAB_TICKS - 2);
    expect(f.state).not.toBe('ledge');
  });
});
