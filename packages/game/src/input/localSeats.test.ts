import { describe, expect, it } from 'vitest';
import { extrasFromPads, joinablePads, keepExtras, seatPads } from './localSeats';

describe('lugares do jogo local', () => {
  it('P1 e P2 usam os controles 1 e 2; quem entra vem depois, na ordem', () => {
    expect(seatPads([])).toEqual([0, 1]);
    expect(seatPads([3, 2])).toEqual([0, 1, 3, 2]);
  });

  it('só controles além do 2º, que não entraram, e com lugar sobrando', () => {
    expect(joinablePads(2, [])).toEqual([]);
    expect(joinablePads(4, [])).toEqual([2, 3]);
    expect(joinablePads(4, [3])).toEqual([2]);
    expect(joinablePads(5, [2, 3])).toEqual([]);
  });

  it('controle desconectado sai do lugar', () => {
    expect(keepExtras([2, 3], 3)).toEqual([2]);
    expect(keepExtras([3, 2], 4)).toEqual([3, 2]);
    expect(keepExtras([1, 2, 2, 3, 4], 5)).toEqual([2, 3]);
  });

  it('volta a lista dos que entraram a partir do controle de cada jogador', () => {
    expect(extrasFromPads([0, 1, 3])).toEqual([3]);
    expect(extrasFromPads(undefined)).toEqual([]);
  });
});
