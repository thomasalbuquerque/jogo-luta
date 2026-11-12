import { describe, expect, it } from 'vitest';
import {
  fitTeams,
  FREE_FOR_ALL,
  hasTeams,
  keepTeams,
  rulesFor,
  splitIndex,
  teamMembers,
  teamName,
  teamSplits,
} from './teams';

describe('times nos menus', () => {
  it('2 contra 2 e 2 contra 1 têm 3 divisões cada, com o P1 no time 0', () => {
    for (const n of [3, 4]) {
      const splits = teamSplits(n);
      expect(splits).toHaveLength(3);
      for (const s of splits) {
        expect(s).toHaveLength(n);
        expect(s[0]).toBe(0);
        expect(new Set(s).size).toBe(2);
      }
      expect(new Set(splits.map((s) => s.join())).size).toBe(3);
    }
    expect(teamSplits(2)).toEqual([]);
  });

  it('acha o índice da divisão', () => {
    expect(splitIndex([0, 1, 0, 1])).toBe(1);
    expect(splitIndex([1, 0, 1, 0])).toBe(-1);
  });

  it('times que não servem para o número de jogadores viram todos contra todos', () => {
    const setup = { teams: [0, 0, 1, 1], friendlyFire: true };
    expect(fitTeams(setup, 4)).toEqual(setup);
    expect(fitTeams(setup, 3)).toEqual(FREE_FOR_ALL);
    expect(fitTeams({ teams: [0, 0, 0, 0], friendlyFire: false }, 4)).toEqual(FREE_FOR_ALL);
  });

  it('quem saiu da sala sai do time; sobra 2 contra 1 ou todos contra todos', () => {
    const setup = { teams: [0, 1, 0, 1], friendlyFire: true };
    expect(keepTeams(setup, [0, 1, 2])).toEqual({ teams: [0, 1, 0], friendlyFire: true });
    // saiu o P1: o novo P1 era do time 1, então os nomes trocam
    expect(keepTeams(setup, [1, 2, 3])).toEqual({ teams: [0, 1, 0], friendlyFire: true });
    expect(keepTeams(setup, [0, 1])).toEqual(FREE_FOR_ALL);
    expect(keepTeams(FREE_FOR_ALL, [0, 1, 2])).toEqual(FREE_FOR_ALL);
  });

  it('o fogo amigo só vai para as regras com times', () => {
    expect(rulesFor({ teams: [0, 0, 1], friendlyFire: true }).friendlyFire).toBe(true);
    expect(rulesFor({ teams: null, friendlyFire: true }).friendlyFire).toBe(false);
  });

  it('reconhece luta com times e escreve os nomes', () => {
    expect(hasTeams([{ team: 0 }, { team: 1 }, { team: 2 }])).toBe(false);
    expect(hasTeams([{ team: 0 }, { team: 1 }, { team: 0 }])).toBe(true);
    expect(teamMembers([0, 1, 0, 1], 0)).toBe('P1 + P3');
    expect(teamName(1)).toBe('TIME AZUL');
  });
});
