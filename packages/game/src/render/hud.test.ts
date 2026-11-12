import { describe, expect, it } from 'vitest';
import { createGame } from '@jogo-luta/sim';
import { countdownNumber, damageColor, formatClock, resultText } from './hud';

function channels(color: number): [number, number, number] {
  return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
}

describe('hud', () => {
  it('formata o tempo em m:ss', () => {
    expect(formatClock(4 * 60 * 60)).toBe('4:00');
    expect(formatClock(61 * 60)).toBe('1:01');
    expect(formatClock(1)).toBe('0:01');
    expect(formatClock(0)).toBe('0:00');
  });

  it('anuncia o vencedor ou o empate', () => {
    const solo = createGame().fighters;
    expect(resultText({ winner: 0, winnerTeam: 0, fighters: solo })).toBe('P1 VENCEU!');
    expect(resultText({ winner: 1, winnerTeam: 1, fighters: solo })).toBe('P2 VENCEU!');
    expect(resultText({ winner: null, winnerTeam: null, fighters: solo })).toBe('EMPATE!');
    const teams = createGame({ characters: ['base', 'base', 'base'], teams: [0, 1, 1] }).fighters;
    expect(resultText({ winner: 2, winnerTeam: 1, fighters: teams })).toBe('TIME AZUL VENCEU!');
  });

  it('o % esquenta: branco no 0, vermelho perto de 140, vinho depois', () => {
    expect(damageColor(0)).toBe(0xffffff);
    expect(damageColor(140)).toBe(0xf03a26);
    expect(damageColor(999)).toBe(0x7a0a1f);
    // cada vez menos verde e azul conforme sobe
    let last = channels(damageColor(0));
    for (let d = 10; d <= 300; d += 10) {
      const c = channels(damageColor(d));
      expect(c[1]).toBeLessThanOrEqual(last[1]);
      expect(c[2]).toBeLessThanOrEqual(last[2]);
      last = c;
    }
  });

  it('contagem: 3, 2, 1 e depois nada', () => {
    expect(countdownNumber(150, 150)).toBe(3);
    expect(countdownNumber(101, 150)).toBe(3);
    expect(countdownNumber(100, 150)).toBe(2);
    expect(countdownNumber(50, 150)).toBe(1);
    expect(countdownNumber(1, 150)).toBe(1);
    expect(countdownNumber(0, 150)).toBe(0);
  });
});
