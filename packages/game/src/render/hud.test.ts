import { describe, expect, it } from 'vitest';
import { formatClock, resultText, stocksLabel } from './hud';

describe('hud', () => {
  it('formata o tempo em m:ss', () => {
    expect(formatClock(4 * 60 * 60)).toBe('4:00');
    expect(formatClock(61 * 60)).toBe('1:01');
    expect(formatClock(1)).toBe('0:01');
    expect(formatClock(0)).toBe('0:00');
  });

  it('mostra stocks restantes e perdidos', () => {
    expect(stocksLabel(3, 3)).toBe('●●●');
    expect(stocksLabel(1, 3)).toBe('●○○');
    expect(stocksLabel(0, 3)).toBe('○○○');
  });

  it('anuncia o vencedor ou o empate', () => {
    expect(resultText({ winner: 0 })).toBe('P1 VENCEU!');
    expect(resultText({ winner: 1 })).toBe('P2 VENCEU!');
    expect(resultText({ winner: null })).toBe('EMPATE!');
  });
});
