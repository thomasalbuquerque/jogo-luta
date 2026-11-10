import { describe, expect, it } from 'vitest';
import { px } from './constants';
import { createFighter, DEFAULT_STATS, jumpVelocity, stepFighter, type Fighter } from './fighter';
import { Button } from './input';
import type { Solid } from './physics';

const { LEFT, RIGHT, DOWN, JUMP, DODGE } = Button;

/** Chão de -1000 a 1000 px com topo em y=0, e uma plataforma em y=-200. */
const solids: Solid[] = [
  { kind: 'solid', x: px(-1000), y: 0, w: px(2000), h: px(500) },
  { kind: 'platform', x: px(-100), y: px(-200), w: px(200), h: px(16) },
];

function run(f: Fighter, input: number, ticks = 1): void {
  for (let i = 0; i < ticks; i++) stepFighter(f, input, solids);
}

function onGround(x = 300): Fighter {
  const f = createFighter(0, { x: px(x), y: 0 });
  run(f, 0, 2);
  return f;
}

/** Pula do chão e devolve a menor altura (y) alcançada pelos pés. */
function peak(f: Fighter, input: number, ticks: number): number {
  let top = f.y + f.h;
  for (let i = 0; i < ticks; i++) {
    stepFighter(f, i === 0 ? input | JUMP : input, solids);
    top = Math.min(top, f.y + f.h);
  }
  return top;
}

describe('fighter', () => {
  it('nasce em pé no chão e fica parado', () => {
    const f = onGround();
    expect(f.grounded).toBe(true);
    expect(f.state).toBe('idle');
    expect(f.y + f.h).toBe(0);
  });

  it('anda acelerando até a velocidade máxima e vira para o lado', () => {
    const f = onGround();
    run(f, LEFT, 30);
    expect(f.vx).toBe(-DEFAULT_STATS.walkSpeed);
    expect(f.facing).toBe(-1);
    expect(f.state).toBe('run');
    run(f, 0, 30);
    expect(f.vx).toBe(0);
    expect(f.state).toBe('idle');
  });

  it('pulo segurado chega perto de jumpHeight; pulo curto sobe menos', () => {
    const alto = peak(onGround(), JUMP, 60);
    expect(-alto).toBeGreaterThan(DEFAULT_STATS.jumpHeight * 0.9);
    expect(-alto).toBeLessThan(DEFAULT_STATS.jumpHeight * 1.1);

    const curto = peak(onGround(), 0, 60);
    expect(-curto).toBeLessThan(-alto * 0.6);
  });

  it('tem 1 pulo aéreo, recarregado ao tocar o chão', () => {
    const f = onGround();
    run(f, JUMP);
    run(f, JUMP, 10);
    run(f, 0);
    run(f, JUMP);
    expect(f.airJumpsLeft).toBe(0);
    expect(f.vy).toBeLessThan(0);
    run(f, 0);
    const vyBefore = f.vy;
    run(f, JUMP); // terceiro pulo: não acontece
    expect(f.vy).toBeGreaterThan(vyBefore);
    run(f, 0, 120);
    expect(f.grounded).toBe(true);
    expect(f.airJumpsLeft).toBe(1);
  });

  it('pulo apertado pouco antes de pousar sai ao pousar (buffer)', () => {
    const f = onGround();
    run(f, JUMP, 20);
    // cai até ficar a poucos ticks do chão
    let guard = 0;
    while (f.y + f.h < px(-15) || f.vy < 0) {
      run(f, 0);
      if (++guard > 200) throw new Error('não caiu');
    }
    f.airJumpsLeft = 0;
    run(f, JUMP);
    run(f, JUMP, 6);
    expect(f.vy).toBeLessThan(0);
  });

  it('fast fall acelera a queda ao segurar ↓ depois do ápice', () => {
    const f = onGround();
    run(f, JUMP, 40);
    expect(f.vy).toBeGreaterThanOrEqual(0);
    run(f, DOWN);
    expect(f.fastFalling).toBe(true);
    expect(f.vy).toBe(DEFAULT_STATS.fastFallSpeed);
  });

  it('desce da plataforma atravessável com ↓', () => {
    const f = createFighter(0, { x: 0, y: px(-200) });
    run(f, 0, 2);
    expect(f.grounded).toBe(true);
    expect(f.onPlatform).toBe(true);
    run(f, DOWN, 30);
    expect(f.y + f.h).toBe(0);
    expect(f.onPlatform).toBe(false);
  });

  it('pula de baixo para cima atravessando a plataforma', () => {
    const f = onGround(0);
    run(f, JUMP, 15);
    run(f, 0);
    run(f, JUMP, 20); // pulo aéreo para passar dos 200 px
    run(f, 0, 60);
    expect(f.grounded).toBe(true);
    expect(f.y + f.h).toBe(px(-200));
  });

  it('dash no chão vai mais rápido que andar e tem cooldown', () => {
    const f = onGround();
    run(f, RIGHT | DODGE);
    expect(f.state).toBe('dash');
    expect(f.vx).toBe(DEFAULT_STATS.dashSpeed);
    run(f, RIGHT, DEFAULT_STATS.dashTicks);
    expect(f.state).toBe('run');
    expect(f.vx).toBe(DEFAULT_STATS.walkSpeed);
    run(f, RIGHT | DODGE);
    expect(f.state).toBe('run'); // ainda em cooldown
  });

  it('dodge aéreo: 1 por vez no ar, invencível e sem gravidade', () => {
    const f = onGround();
    run(f, JUMP, 15);
    run(f, LEFT | DODGE);
    expect(f.state).toBe('dodge');
    expect(f.invulnTicks).toBeGreaterThan(0);
    const y = f.y;
    run(f, LEFT, 5);
    expect(f.y).toBe(y);
    expect(f.vx).toBeLessThan(0);
    run(f, 0, DEFAULT_STATS.airDodgeTicks);
    expect(f.state).not.toBe('dodge');
    run(f, DODGE);
    expect(f.state).not.toBe('dodge');
  });

  it('wall jump: desliza na parede e pula para longe dela', () => {
    // corpo no ar encostado na lateral direita do chão sólido
    const f = createFighter(0, { x: px(1000) + px(24), y: px(200) });
    f.vy = px(5);
    run(f, LEFT);
    expect(f.wallDir).toBe(-1);
    run(f, LEFT, 10);
    expect(f.state).toBe('wallslide');
    expect(f.vy).toBeLessThanOrEqual(DEFAULT_STATS.wallSlideSpeed);
    run(f, LEFT | JUMP);
    expect(f.vx).toBe(DEFAULT_STATS.wallJumpSpeedX);
    expect(f.vy).toBeLessThan(0);
    expect(f.facing).toBe(1);
  });

  it('a velocidade do pulo vem da altura e da gravidade', () => {
    expect(jumpVelocity(px(0.65), px(175))).toBe(1508);
  });
});
