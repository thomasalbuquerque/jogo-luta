import { describe, expect, it } from 'vitest';
import { bindKey, bindPadButton, DEFAULT_CONTROLS } from '../input/controls';
import { quickButtonLabel, quickHeaders, quickRows } from './quickControls';

describe('cola de comandos', () => {
  it('teclado: uma coluna por jogador, com as teclas de cada um', () => {
    const rows = quickRows(DEFAULT_CONTROLS, 'keyboard', [0, 1]);
    expect(quickHeaders('keyboard', [0, 1])).toEqual(['P1', 'P2']);
    expect(rows[0]?.values).toEqual(['W A S D', '↑ ← ↓ →']);
    expect(rows.find((r) => r.label.startsWith('Ataque'))?.values).toEqual(['V', 'K']);
    expect(rows.find((r) => r.label === 'Esquiva')?.values).toEqual(['Shift esq.', 'I']);
  });

  it('online: só as teclas do P1', () => {
    const rows = quickRows(DEFAULT_CONTROLS, 'keyboard', [0]);
    expect(quickHeaders('keyboard', [0])).toEqual(['P1']);
    for (const row of rows) expect(row.values).toHaveLength(1);
  });

  it('controle: analógico para andar e os botões do mapa do controle', () => {
    const rows = quickRows(DEFAULT_CONTROLS, 'pad', [0, 1]);
    expect(quickHeaders('pad', [0, 1])).toEqual(['Controle']);
    expect(rows[0]?.values).toEqual(['Analógico/D-pad']);
    expect(rows.find((r) => r.label.startsWith('Pular'))?.values).toEqual(['A']);
    expect(rows.find((r) => r.label === 'Esquiva')?.values).toEqual(['RB / RT']);
  });

  it('mostra os controles remapeados', () => {
    const c = bindPadButton(bindKey(DEFAULT_CONTROLS, 0, 'ATTACK', 'KeyF'), 'JUMP', 3);
    expect(quickRows(c, 'keyboard', [0]).find((r) => r.label.startsWith('Ataque'))?.values).toEqual(
      ['F'],
    );
    expect(quickRows(c, 'pad', [0]).find((r) => r.label.startsWith('Pular'))?.values).toEqual([
      'Y',
    ]);
  });

  it('botão de abrir: Tab no teclado, Select no controle', () => {
    expect(quickButtonLabel('keyboard')).toBe('Tab');
    expect(quickButtonLabel('pad')).toBe('Select');
  });
});
