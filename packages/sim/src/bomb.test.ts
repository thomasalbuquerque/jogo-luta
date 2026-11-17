import { describe, expect, it } from 'vitest';
import { bombDefOf, type Bomb } from './bomb';
import { registerCharacter } from './characters';
import { THOM4O } from './characters/thom4o';
import { px } from './constants';
import type { Fighter } from './fighter';
import { createGame, stepGame, type GameState } from './game';
import { Button } from './input';
import { cloneState, hashState } from './snapshot';

registerCharacter(THOM4O);
const DEF = THOM4O.special?.move.grab?.bomb;
if (!DEF) throw new Error('Thom4o sem bomba');

/**
 * Thom4o (id 0) e mais lutadores no chão do mapa de teste. `gaps`: distância (px) do
 * centro de cada outro lutador ao centro do Thom4o, para a direita.
 */
function setup(characters: string[], gaps: number[]) {
  const g = createGame({ characters, rules: { stocks: 3, timeLimitTicks: 0 } });
  for (let i = 0; i < 41; i++) stepGame(g, inputs(g));
  const [thom] = g.fighters as [Fighter];
  thom.x = px(-150) - thom.w / 2;
  thom.facing = 1;
  for (const [i, gap] of gaps.entries()) {
    const f = g.fighters[i + 1] as Fighter;
    f.x = thom.x + thom.w / 2 + px(gap) - f.w / 2;
    f.facing = -1;
  }
  stepGame(g, inputs(g));
  return { g, thom, others: g.fighters.slice(1) };
}

function inputs(g: GameState, who = -1, mask = 0): number[] {
  return g.fighters.map((f) => (f.id === who ? mask : 0));
}

/** Avança `ticks` sem input; devolve os eventos da bomba e os acertos. */
function run(g: GameState, ticks: number) {
  const bombs: string[] = [];
  const hits: { kind: string; victim: number; damage: number }[] = [];
  for (let i = 0; i < ticks; i++) {
    stepGame(g, inputs(g));
    for (const e of g.events) {
      if (e.type === 'bomb') bombs.push(`${e.action}:${String(e.carrier)}`);
      if (e.type === 'hit') hits.push(e);
    }
  }
  return { bombs, hits };
}

/** Planta no lutador 1 (colado na frente) e espera o empurrão. */
function plant(characters = ['thom4o', 'base'], gaps = [56]) {
  const s = setup(characters, gaps);
  stepGame(s.g, inputs(s.g, 0, Button.SPECIAL));
  const r = run(s.g, 40);
  return { ...s, ...r };
}

function bomb(g: GameState): Bomb {
  const b = g.bombs[0];
  if (!b) throw new Error('sem bomba');
  return b;
}

describe('bomba do Thom4o', () => {
  it('a ficha: agarrão curto com a bomba', () => {
    expect(THOM4O.special?.name).toBe('Tá plantada!');
    expect(THOM4O.special?.move.grab?.holdTicks).toBe(14);
    expect(bombDefOf({ character: 'thom4o' })).toBe(DEF);
    expect(bombDefOf({ character: 'meia' })).toBeNull();
    expect(DEF.fuseTicks).toBe(300);
    expect(DEF.carrierHit.damage).toBe(18);
    expect(DEF.areaHit.damage).toBe(10);
    expect(DEF.areaW).toBe(px(220));
  });

  it('colado, pega e cola a bomba com o empurrão de 3%', () => {
    const { g, others, bombs, hits } = plant();
    const foe = others[0] as Fighter;
    expect(bombs).toEqual(['plant:1']);
    expect(hits.map((h) => h.kind)).toEqual(['throw']);
    expect(foe.damage).toBe(3);
    const b = bomb(g);
    expect(b.owner).toBe(0);
    expect(b.locked).toBe(0);
    expect(b.ticksLeft).toBeLessThan(DEF.fuseTicks);
    expect(b.ticksLeft).toBeGreaterThan(DEF.fuseTicks - 40);
  });

  it('de longe erra: nada de bomba, só a recarga curta da ficha', () => {
    const { g, thom } = setup(['thom4o', 'base'], [120]);
    stepGame(g, inputs(g, 0, Button.SPECIAL));
    const { bombs } = run(g, 40);
    expect(bombs).toEqual([]);
    expect(g.bombs).toEqual([]);
    expect(thom.specialCooldown).toBe((THOM4O.special?.cooldownTicks ?? 0) - 40);
    expect(thom.specialCooldownTotal).toBe(THOM4O.special?.cooldownTicks);
  });

  it('com a bomba em jogo, o especial não sai; depois que ela estoura, a recarga longa da bomba', () => {
    const { g, thom } = plant();
    expect(thom.specialCooldown).toBeGreaterThan(THOM4O.special?.cooldownTicks ?? 0);
    run(g, 40);
    expect(thom.state).not.toBe('attack');
    stepGame(g, inputs(g, 0, Button.SPECIAL));
    run(g, 3);
    expect(thom.move).not.toBe('special');
    run(g, bomb(g).ticksLeft);
    expect(g.bombs).toEqual([]);
    expect(thom.specialCooldown).toBe(DEF.cooldownTicks);
    expect(thom.specialCooldownTotal).toBe(DEF.cooldownTicks);
  });

  it('o relógio zera: estoura em quem está com ela, 18% e para cima', () => {
    const { g, others } = plant(['thom4o', 'base'], [56]);
    const foe = others[0] as Fighter;
    // longe do Thom4o, para a área não pegar ele
    foe.x += px(300);
    const { bombs, hits } = run(g, bomb(g).ticksLeft);
    expect(bombs).toEqual(['explode:1']);
    expect(hits).toEqual([expect.objectContaining({ kind: 'bomb', victim: 1, damage: 18 })]);
    expect(foe.damage).toBe(3 + 18);
    expect(foe.state).toBe('hitstun');
    expect(foe.kby).toBeLessThan(0);
    expect(foe.kbx).toBe(0);
  });

  it('a área pega quem está perto, inclusive o Thom4o, e não quem está longe', () => {
    const { g, thom, others } = plant(['thom4o', 'base', 'base'], [56, 700]);
    const [foe, far] = others as [Fighter, Fighter];
    // o Thom4o colado no portador, o 3º longe
    thom.x = foe.x - px(70);
    const { hits } = run(g, bomb(g).ticksLeft);
    expect(hits.map((h) => `${String(h.victim)}:${String(h.damage)}`).sort()).toEqual([
      '0:10',
      '1:18',
    ]);
    expect(thom.kbx).toBeLessThan(0);
    expect(far.damage).toBe(0);
  });

  it('o portador passa com um golpe de corpo; trava de 60 e piso do relógio', () => {
    const { g, thom, others } = plant();
    const foe = others[0] as Fighter;
    // espera a trava acabar e o relógio cair abaixo do piso
    run(g, bomb(g).ticksLeft - 100);
    expect(bomb(g).locked).toBe(-1);
    foe.x = thom.x + px(40);
    foe.facing = -1;
    foe.state = 'idle';
    stepGame(g, inputs(g, 1, Button.ATTACK));
    const { bombs } = run(g, 20);
    expect(bombs).toEqual(['pass:0']);
    const b = bomb(g);
    expect(b.carrier).toBe(0);
    expect(b.locked).toBe(1);
    expect(b.ticksLeft).toBeGreaterThan(DEF.floorTicks - 25);
  });

  it('na trava, o golpe acerta mas a bomba fica', () => {
    const { g, thom, others } = plant();
    const foe = others[0] as Fighter;
    foe.x = thom.x + px(40);
    foe.state = 'idle';
    foe.hitstop = 0;
    // o adversário ainda está no arremesso: espera ele sair do hitstun, dentro da trava
    run(g, 2);
    foe.state = 'idle';
    foe.x = thom.x + px(40);
    foe.facing = -1;
    stepGame(g, inputs(g, 1, Button.ATTACK));
    const { bombs, hits } = run(g, 15);
    expect(hits.some((h) => h.victim === 0)).toBe(true);
    expect(bombs).toEqual([]);
    expect(bomb(g).carrier).toBe(1);
  });

  it('golpe do Thom4o no portador não muda nada', () => {
    const { g, thom, others } = plant();
    const foe = others[0] as Fighter;
    run(g, 70);
    foe.x = thom.x + px(40);
    thom.facing = 1;
    thom.state = 'idle';
    stepGame(g, inputs(g, 0, Button.ATTACK));
    const { bombs, hits } = run(g, 15);
    expect(hits.some((h) => h.victim === 1)).toBe(true);
    expect(bombs).toEqual([]);
    expect(bomb(g).carrier).toBe(1);
  });

  it('quem está com a bomba e perde a vida leva ela junto', () => {
    const { g, thom, others } = plant();
    const foe = others[0] as Fighter;
    foe.y = px(5000);
    const { bombs } = run(g, 1);
    expect(bombs).toEqual(['vanish:1']);
    expect(g.bombs).toEqual([]);
    expect(thom.specialCooldown).toBe(DEF.cooldownTicks);
  });

  it('entra no snapshot e no hash', () => {
    const { g } = plant();
    const copy = cloneState(g);
    expect(copy.bombs).toEqual(g.bombs);
    expect(copy.bombs[0]).not.toBe(g.bombs[0]);
    const before = hashState(g);
    (g.bombs[0] as Bomb).ticksLeft--;
    expect(hashState(g)).not.toBe(before);
  });
});
