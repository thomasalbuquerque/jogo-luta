import { describe, expect, it } from 'vitest';
import { getCharacter, PLAYABLE_CHARACTERS } from '@jogo-luta/sim';
import { colorValue, statBars } from './fighterLook';

describe('visual do lutador', () => {
  it('converte cor #rrggbb', () => {
    expect(colorValue('#1f6f78')).toBe(0x1f6f78);
    expect(colorValue('#FFFFFF')).toBe(0xffffff);
  });

  it('barras da seleção ficam entre 0 e 1 e mostram a diferença', () => {
    const [schummaki, joao] = PLAYABLE_CHARACTERS.map((id) => statBars(getCharacter(id)));
    for (const b of [...(schummaki ?? []), ...(joao ?? [])]) {
      expect(b.value).toBeGreaterThanOrEqual(0);
      expect(b.value).toBeLessThanOrEqual(1);
    }
    const value = (bars: typeof schummaki, label: string) =>
      bars?.find((b) => b.label === label)?.value ?? 0;
    expect(value(schummaki, 'Peso')).toBeGreaterThan(value(joao, 'Peso'));
    expect(value(schummaki, 'Chão')).toBeGreaterThan(value(joao, 'Chão'));
    expect(value(joao, 'Ar')).toBeGreaterThan(value(schummaki, 'Ar'));
  });
});
