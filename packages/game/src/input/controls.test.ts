import { describe, expect, it } from 'vitest';
import { allCodes } from './bindings';
import {
  bindKey,
  bindPadButton,
  DEFAULT_CONTROLS,
  isReservedKey,
  isReservedPadButton,
  keyLabel,
  padButtonLabel,
  parseControls,
} from './controls';

describe('controles', () => {
  it('remapeia uma tecla livre', () => {
    const c = bindKey(DEFAULT_CONTROLS, 0, 'ATTACK', 'KeyF');
    expect(c.keys[0]?.ATTACK).toEqual(['KeyF']);
    expect(DEFAULT_CONTROLS.keys[0]?.ATTACK).toEqual(['KeyV']); // não muda o original
  });

  it('tecla já usada pelo mesmo jogador: os dois botões trocam', () => {
    const c = bindKey(DEFAULT_CONTROLS, 0, 'ATTACK', 'KeyB');
    expect(c.keys[0]?.ATTACK).toEqual(['KeyB']);
    expect(c.keys[0]?.SPECIAL).toEqual(['KeyV']);
  });

  it('tecla do outro jogador: troca entre os jogadores', () => {
    const c = bindKey(DEFAULT_CONTROLS, 0, 'JUMP', 'KeyK');
    expect(c.keys[0]?.JUMP).toEqual(['KeyK']);
    expect(c.keys[1]?.ATTACK).toEqual(['Space']);
    const [p1, p2] = c.keys;
    if (!p1 || !p2) throw new Error('sem jogadores');
    const p1Codes = allCodes([p1]);
    for (const code of allCodes([p2])) expect(p1Codes.has(code)).toBe(false);
  });

  it('controle: troca os botões e mantém as outras ações', () => {
    const c = bindPadButton(DEFAULT_CONTROLS, 'JUMP', 2);
    expect(c.pad.JUMP).toEqual([2]);
    expect(c.pad.ATTACK).toEqual([0]);
    // esquiva tem 2 botões: perder 1 não precisa trocar
    const d = bindPadButton(DEFAULT_CONTROLS, 'TAUNT', 7);
    expect(d.pad.TAUNT).toEqual([7]);
    expect(d.pad.DODGE).toEqual([5]);
  });

  it('lê o que foi salvo e volta ao padrão no que estiver estranho', () => {
    const saved: unknown = JSON.parse(
      JSON.stringify(bindKey(DEFAULT_CONTROLS, 1, 'TAUNT', 'KeyO')),
    );
    expect(parseControls(saved).keys[1]?.TAUNT).toEqual(['KeyO']);
    expect(parseControls(null)).toEqual(DEFAULT_CONTROLS);
    expect(parseControls('lixo')).toEqual(DEFAULT_CONTROLS);
    const partial = parseControls({ keys: [{ ATTACK: ['KeyF'], JUMP: 3 }], pad: { JUMP: [9] } });
    expect(partial.keys[0]?.ATTACK).toEqual(['KeyF']);
    expect(partial.keys[0]?.JUMP).toEqual(DEFAULT_CONTROLS.keys[0]?.JUMP);
    expect(partial.keys[1]).toEqual(DEFAULT_CONTROLS.keys[1]);
    expect(partial.pad.JUMP).toEqual([0]); // Start é reservado
  });

  it('tecla repetida no que foi salvo: volta tudo ao padrão', () => {
    expect(parseControls({ keys: [{ ATTACK: ['KeyK'] }] })).toEqual(DEFAULT_CONTROLS);
  });

  it('Enter, Esc, M, ` e F1–F12 não podem ser usados', () => {
    for (const code of ['Enter', 'Escape', 'KeyM', 'Backquote', 'F5', 'F12']) {
      expect(isReservedKey(code)).toBe(true);
    }
    expect(isReservedKey('KeyF')).toBe(false);
    expect(isReservedPadButton(9)).toBe(true);
    expect(isReservedPadButton(13)).toBe(true);
    expect(isReservedPadButton(4)).toBe(false);
  });

  it('nomes das teclas e dos botões', () => {
    expect(keyLabel('KeyA')).toBe('A');
    expect(keyLabel('Space')).toBe('Espaço');
    expect(keyLabel('ArrowLeft')).toBe('←');
    expect(keyLabel('Digit7')).toBe('7');
    expect(keyLabel('Numpad3')).toBe('Num 3');
    expect(keyLabel('Semicolon')).toBe('Ç');
    expect(padButtonLabel(0)).toBe('A');
    expect(padButtonLabel(7)).toBe('RT');
  });
});
