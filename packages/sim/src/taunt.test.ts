import { describe, expect, it } from 'vitest';
import { BASE_CHARACTER_ID, getCharacter } from './characters';
import { applyHit } from './combat';
import { px } from './constants';
import { createFighter, stepFighter, type Fighter } from './fighter';
import { Button } from './input';
import type { Solid } from './physics';

const { RIGHT, ATTACK, TAUNT } = Button;
const solids: Solid[] = [{ kind: 'solid', x: px(-1000), y: 0, w: px(2000), h: px(500) }];
const DURATION = getCharacter(BASE_CHARACTER_ID).taunt.durationTicks;

function run(f: Fighter, input: number, ticks = 1): void {
  for (let i = 0; i < ticks; i++) stepFighter(f, input, solids);
}

function onGround(): Fighter {
  const f = createFighter(0, { x: 0, y: 0 });
  run(f, 0, 2);
  return f;
}

describe('provocação', () => {
  it('no chão: fica parado provocando pela duração da ficha, depois volta', () => {
    const f = onGround();
    run(f, TAUNT);
    expect(f.state).toBe('taunt');
    run(f, RIGHT | ATTACK, DURATION - 1);
    expect(f.state).toBe('taunt');
    expect(f.vx).toBe(0);
    run(f, 0);
    expect(f.state).toBe('idle');
  });

  it('no ar não provoca', () => {
    const f = createFighter(0, { x: 0, y: px(-400) });
    run(f, 0, 2);
    run(f, TAUNT);
    expect(f.state).toBe('fall');
  });

  it('levar golpe desfaz a provocação', () => {
    const f = onGround();
    const other = createFighter(1, { x: px(60), y: 0 });
    run(f, TAUNT);
    applyHit(other, f, 'neutralLight');
    expect(f.state).toBe('hitstun');
  });
});
