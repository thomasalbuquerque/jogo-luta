import { Button } from '@jogo-luta/sim';
import { describe, expect, it } from 'vitest';
import { allCodes, maskFromKeys, maskFromPad, P1_KEYS, P2_KEYS } from './bindings';

describe('bindings', () => {
  it('teclado: cada jogador só enxerga as próprias teclas', () => {
    const down = new Set(['KeyA', 'Space', 'ArrowRight']);
    expect(maskFromKeys(down, P1_KEYS)).toBe(Button.LEFT | Button.JUMP);
    expect(maskFromKeys(down, P2_KEYS)).toBe(Button.RIGHT);
  });

  it('os dois jogadores não compartilham teclas', () => {
    const p1 = allCodes([P1_KEYS]);
    for (const code of allCodes([P2_KEYS])) expect(p1.has(code)).toBe(false);
  });

  it('gamepad: botões e analógico com zona morta', () => {
    const buttons = Array.from({ length: 17 }, () => false);
    buttons[0] = true; // A
    buttons[7] = true; // RT
    expect(maskFromPad({ buttons, axes: [0.3, 0.9] })).toBe(
      Button.JUMP | Button.DODGE | Button.DOWN,
    );
    expect(maskFromPad({ buttons: [], axes: [-0.8, -0.6] })).toBe(Button.LEFT | Button.UP);
  });
});
