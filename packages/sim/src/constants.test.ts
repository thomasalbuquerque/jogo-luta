import { describe, expect, it } from 'vitest';
import { TICK_MS, TICK_RATE } from './constants';

describe('constants', () => {
  it('simula a 60 ticks por segundo', () => {
    expect(TICK_RATE).toBe(60);
    expect(TICK_MS * TICK_RATE).toBeCloseTo(1000);
  });
});
