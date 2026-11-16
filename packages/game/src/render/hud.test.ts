import { describe, expect, it } from 'vitest';
import { createFighter, createGame, getCharacter } from '@jogo-luta/sim';
import { countdownNumber, damageColor, formatClock, resultText, specialBar } from './hud';

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
    // com nome, o nome de quem venceu
    const names = ['Thomas', null];
    expect(resultText({ winner: 0, winnerTeam: 0, fighters: solo }, names)).toBe('THOMAS VENCEU!');
    expect(resultText({ winner: 1, winnerTeam: 1, fighters: solo }, names)).toBe('P2 VENCEU!');
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

  describe('barra do especial', () => {
    const spawn = { x: 0, y: 0 };

    it('não tem barra sem especial', () => {
      expect(specialBar(createFighter(0, spawn))).toBeNull();
    });

    it('enche conforme a recarga passa e fica pronta no fim', () => {
      const f = createFighter(0, spawn, 'marilia');
      const total = getCharacter('marilia').special?.cooldownTicks ?? 0;
      expect(specialBar(f)).toEqual({ fill: 1, status: 'ready' });
      f.specialCooldown = total;
      expect(specialBar(f)).toEqual({ fill: 0, status: 'charging' });
      f.specialCooldown = total / 4;
      expect(specialBar(f)).toEqual({ fill: 0.75, status: 'charging' });
    });

    it('recarregado mas gasto no ar espera tocar o chão', () => {
      const f = createFighter(0, spawn, 'tauba');
      f.grounded = false;
      f.specialUsed = true;
      expect(specialBar(f)).toEqual({ fill: 1, status: 'spent' });
      f.grounded = true;
      expect(specialBar(f)).toEqual({ fill: 1, status: 'ready' });
    });
  });
});
