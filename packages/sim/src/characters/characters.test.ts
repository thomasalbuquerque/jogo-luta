import { describe, expect, it } from 'vitest';
import { createGame, stepGame } from '../game';
import { cloneState } from '../snapshot';
import { Button } from '../input';
import { getCharacter, PLAYABLE_CHARACTERS } from './index';

const [SCHUMMAKI, JOAO, DADA, TAUBA] = PLAYABLE_CHARACTERS.map(getCharacter);
if (!SCHUMMAKI || !JOAO || !DADA || !TAUBA) throw new Error('elenco incompleto');

describe('elenco', () => {
  it('Schummaki, João Frango, Dadazinho e Tauba, cada um com especial e provocação', () => {
    expect(PLAYABLE_CHARACTERS).toEqual(['schummaki', 'joao-frango', 'dadazinho', 'tauba']);
    for (const c of [SCHUMMAKI, JOAO, DADA, TAUBA]) {
      expect(c.special).not.toBeNull();
      expect(c.taunt.text.length).toBeGreaterThan(0);
      expect(c.blurb.length).toBeGreaterThan(0);
    }
  });

  it('Schummaki vai para cima: investida, mais rápido no chão e mais pesado', () => {
    expect(SCHUMMAKI.special?.move.dash).toBeDefined();
    expect(SCHUMMAKI.special?.oncePerAir).toBe(true);
    expect(SCHUMMAKI.stats.walkSpeed).toBeGreaterThan(JOAO.stats.walkSpeed);
    expect(SCHUMMAKI.stats.weight).toBeGreaterThan(100);
  });

  it('João Frango controla de longe: projétil, leve e melhor no ar', () => {
    expect(JOAO.special?.move.projectile).toBeDefined();
    expect(JOAO.special?.cooldownTicks).toBeGreaterThan(0);
    expect(JOAO.stats.weight).toBeLessThan(100);
    expect(JOAO.stats.airJumps).toBeGreaterThan(SCHUMMAKI.stats.airJumps);
    expect(JOAO.stats.airSpeed).toBeGreaterThan(SCHUMMAKI.stats.airSpeed);
  });

  it('Dadazinho pune de perto: tiro curto, forte e lento; leve, rápido e baixinho', () => {
    const shot = DADA.special?.move.projectile;
    const chicken = JOAO.special?.move.projectile;
    if (!shot || !chicken) throw new Error('sem projétil');
    // alcance: velocidade × duração
    expect(shot.speed * shot.lifetimeTicks).toBeLessThan(
      (chicken.speed * chicken.lifetimeTicks) / 2,
    );
    expect(shot.hit.damage).toBeGreaterThan(chicken.hit.damage * 2);
    expect(DADA.special?.move.startup).toBeGreaterThan(JOAO.special?.move.startup ?? 0);
    expect(DADA.special?.cooldownTicks).toBeGreaterThan(JOAO.special?.cooldownTicks ?? 0);
    expect(DADA.stats.weight).toBeLessThan(100);
    expect(DADA.stats.walkSpeed).toBeGreaterThan(JOAO.stats.walkSpeed);
    expect(DADA.stats.height).toBeLessThan(JOAO.stats.height);
  });

  it('Tauba foge: some e reaparece num lugar sorteado, sem bater; recarga longa', () => {
    const special = TAUBA.special;
    expect(special?.move.teleport?.random).toEqual({ candidates: 3, nearChance: 25 });
    expect(special?.move.hitboxes).toEqual([]);
    expect(special?.move.projectile).toBeUndefined();
    expect(special?.oncePerAir).toBe(true);
    expect(special?.cooldownTicks).toBeGreaterThanOrEqual(240);
    expect(TAUBA.stats.weight).toBeLessThan(100);
    expect(TAUBA.stats.weight).toBeGreaterThan(DADA.stats.weight);
    // golpes do moveset base, sem ajuste
    expect(TAUBA.moves.sideLight).toBe(getCharacter('base').moves.sideLight);
  });

  it.each(PLAYABLE_CHARACTERS)('%s alcança a plataforma atravessável com 1 pulo', (id) => {
    const g = createGame({ characters: [id, id] });
    stepGame(g, [0, 0]);
    for (let i = 0; i < 30; i++) stepGame(g, [Button.JUMP, 0]);
    for (let i = 0; i < 90; i++) stepGame(g, [0, 0]);
    expect(g.fighters[0]?.onPlatform).toBe(true);
  });

  it('uma luta com inputs pseudoaleatórios roda igual duas vezes', () => {
    const play = () => {
      const g = createGame({ characters: [...PLAYABLE_CHARACTERS] });
      let seed = 12345;
      const next = () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed % 512;
      };
      for (let t = 0; t < 3000; t++) stepGame(g, [next(), next()]);
      return g;
    };
    const a = play();
    const b = play();
    expect(cloneState(a)).toEqual(cloneState(b));
    expect(a.fighters.some((f) => f.damage > 0 || f.stocks < 3)).toBe(true);
  });
});
