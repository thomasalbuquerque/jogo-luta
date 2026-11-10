import { describe, expect, it } from 'vitest';
import { defineCharacter, type CharacterSheet } from './character';
import { registerCharacter } from './characters';
import { resolveHits } from './combat';
import { px } from './constants';
import { canUseSpecial, createFighter, moveFrame, stepFighter, type Fighter } from './fighter';
import { Button } from './input';
import type { Solid } from './physics';

const { LEFT, SPECIAL } = Button;

const solids: Solid[] = [{ kind: 'solid', x: px(-2000), y: 0, w: px(4000), h: px(500) }];
const hit = { damage: 12, angle: 30, baseKnockback: 10, knockbackScale: 0.2 };

/** Registra um personagem de teste com o especial dado e devolve o id. */
function character(id: string, special: CharacterSheet['special']): string {
  registerCharacter(
    defineCharacter({
      id,
      name: id,
      colors: { primary: '#123456', secondary: '#abcdef' },
      stats: {
        weight: 100,
        walkSpeed: 6.5,
        airSpeed: 5.5,
        jumpHeight: 175,
        airJumps: 1,
        hurtbox: { w: 48, h: 96 },
      },
      special,
      taunt: { text: 'Opa!', sound: 'teste', animation: 'teste' },
    }),
  );
  return id;
}

const DASHER = character('t-dash', {
  name: 'Arrancada',
  startup: 10,
  active: 8,
  recovery: 12,
  oncePerAir: true,
  hoverStartup: true,
  blocks: [{ type: 'dash', speed: 15, airSpeed: 9, box: { x: 30, y: 0, w: 60, h: 80 }, hit }],
});

const AREA = character('t-area', {
  name: 'Explosão',
  startup: 6,
  active: 4,
  recovery: 10,
  cooldownTicks: 60,
  blocks: [{ type: 'area', box: { x: 0, y: 0, w: 220, h: 120 }, hit }],
});

/** Avança os lutadores e resolve os acertos, como o stepGame. */
function run(fs: Fighter[], inputs: number[], ticks = 1): void {
  for (let t = 0; t < ticks; t++) {
    for (const f of fs) stepFighter(f, inputs[f.id] ?? 0, solids);
    resolveHits(fs);
  }
}

function onGround(id: number, character: string, x = 0): Fighter {
  const f = createFighter(id, { x: px(x), y: 0 }, character);
  f.facing = 1;
  run([f], [0], 2);
  return f;
}

function inAir(character: string): Fighter {
  const f = createFighter(0, { x: 0, y: px(-800) }, character);
  f.facing = 1;
  run([f], [0], 2);
  return f;
}

describe('especial', () => {
  it('sai com Especial e vira para o lado apertado', () => {
    const f = onGround(0, DASHER);
    run([f], [LEFT | SPECIAL]);
    expect(f.state).toBe('attack');
    expect(f.move).toBe('special');
    expect(f.facing).toBe(-1);
  });

  it('investida: parada no startup, depois dispara reto no active', () => {
    const f = onGround(0, DASHER);
    const x0 = f.x;
    run([f], [SPECIAL]);
    run([f], [0], 9);
    expect(f.x).toBe(x0);
    run([f], [0], 8);
    expect(moveFrame(f)).toBe(18);
    expect(f.x - x0).toBe(px(15) * 8);
  });

  it('investida acerta quem está no caminho', () => {
    const a = onGround(0, DASHER);
    const b = onGround(1, DASHER, 150);
    b.facing = -1;
    run([a, b], [SPECIAL, 0]);
    run([a, b], [0, 0], 20);
    expect(b.damage).toBe(12);
    expect(b.kbx).toBeGreaterThan(0);
  });

  it('no ar: parada no startup, sem cair no active, mais curta e 1 vez por ar', () => {
    const f = inAir(DASHER);
    run([f], [SPECIAL]);
    const x0 = f.x;
    const y0 = f.y;
    run([f], [0], 17);
    expect(f.y).toBe(y0);
    expect(f.x - x0).toBe(px(9) * 8);
    expect(f.specialUsed).toBe(true);
    run([f], [0], 13);
    expect(f.state).toBe('fall');
    expect(canUseSpecial(f)).toBe(false);
    run([f], [SPECIAL]);
    expect(f.move).toBeNull();
    // tocar o chão devolve
    let guard = 0;
    while (!f.grounded) {
      run([f], [0]);
      if (++guard > 200) throw new Error('não pousou');
    }
    expect(canUseSpecial(f)).toBe(true);
  });

  it('recarga: não repete antes do cooldown', () => {
    const f = onGround(0, AREA);
    run([f], [SPECIAL]);
    run([f], [0], 25);
    expect(f.state).toBe('idle');
    expect(f.specialCooldown).toBeGreaterThan(6);
    run([f], [SPECIAL]);
    expect(f.move).toBeNull();
    run([f], [0], 40);
    run([f], [SPECIAL]);
    expect(f.move).toBe('special');
  });

  it('área acerta dos dois lados, arremessando para longe do centro', () => {
    const a = onGround(0, AREA);
    const left = onGround(1, AREA, -80);
    const right = onGround(2, AREA, 80);
    run([a, left, right], [SPECIAL, 0, 0]);
    run([a, left, right], [0, 0, 0], 8);
    expect(left.damage).toBe(12);
    expect(right.damage).toBe(12);
    expect(left.kbx).toBeLessThan(0);
    expect(right.kbx).toBeGreaterThan(0);
  });
});
