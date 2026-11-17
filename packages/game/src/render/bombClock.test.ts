import { describe, expect, it } from 'vitest';
import { beepInterval, clockText } from './bombClock';

describe('bomba na tela', () => {
  it('relógio em segundos com 1 casa e vírgula, sem mostrar 0,0 antes do fim', () => {
    expect(clockText(300)).toBe('5,0');
    expect(clockText(299)).toBe('5,0');
    expect(clockText(294)).toBe('4,9');
    expect(clockText(60)).toBe('1,0');
    expect(clockText(1)).toBe('0,1');
    expect(clockText(0)).toBe('0,1');
  });

  it('o bipe acelera conforme o relógio cai', () => {
    expect(beepInterval(300)).toBeGreaterThan(beepInterval(120));
    expect(beepInterval(120)).toBeGreaterThan(beepInterval(20));
    expect(beepInterval(1)).toBeGreaterThanOrEqual(5);
    expect(beepInterval(600)).toBeLessThanOrEqual(42);
  });
});
