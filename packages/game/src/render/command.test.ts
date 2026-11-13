import { describe, expect, it } from 'vitest';
import { createFighter, moveDef, startMove } from '@jogo-luta/sim';
import { COMMAND, commandLook, commandSymbols, hitsText } from './command';

function meiaInSpecial() {
  const f = createFighter(0, { x: 0, y: 0 }, 'meia');
  f.grounded = true;
  startMove(f, 'special', 0);
  return { f, move: moveDef(f, 'special') };
}

describe('comando do Meia', () => {
  it('↓ ← B ↘ → ↑ X; virado para a esquerda, as setas espelham', () => {
    expect(COMMAND).toHaveLength(7);
    const left = commandSymbols(-1);
    const dirs = left.map((s) => (s.kind === 'arrow' ? s.dir : s.label));
    expect(dirs).toEqual([90, 0, 'B', 135, 180, -90, 'X']);
    expect(commandSymbols(1)).toEqual(COMMAND);
  });

  it('no startup as setas acendem uma a uma; o botão no 1º frame ativo', () => {
    const { f, move } = meiaInSpecial();
    const lit: number[] = [];
    for (let frame = 1; frame <= move.startup + 1; frame++) {
      f.stateTicks = frame - 1;
      lit.push(commandLook(f)?.lit ?? -1);
    }
    expect(lit.at(-2)).toBe(6);
    expect(lit.at(-1)).toBe(7);
    expect([...lit].sort((a, b) => a - b)).toEqual(lit);
  });

  it('errou: vermelho e tremendo no recovery, e some no fim', () => {
    const { f, move } = meiaInSpecial();
    f.stateTicks = move.startup + move.active + 1;
    expect(commandLook(f)).toMatchObject({ miss: true, shake: true, alpha: 1 });
    f.stateTicks = move.startup + move.active + move.recovery;
    expect(commandLook(f)).toBeNull();
  });

  it('pegou: aceso durante o combo e some logo depois do arremesso', () => {
    const { f, move } = meiaInSpecial();
    f.moveHits = 1 << 1;
    f.stateTicks = move.startup;
    f.grabTicks = 30;
    expect(commandLook(f)).toMatchObject({ lit: 7, miss: false, alpha: 1 });
    f.grabTicks = 0;
    f.stateTicks = move.startup + move.active + 20;
    expect(commandLook(f)).toBeNull();
  });

  it('só no especial de agarrão com combo', () => {
    const f = createFighter(0, { x: 0, y: 0 }, 'gabs');
    f.grounded = true;
    startMove(f, 'special', 0);
    expect(commandLook(f)).toBeNull();
  });

  it('o contador mostra "N HITS" a partir do 2º golpe', () => {
    expect(hitsText(1)).toBe('');
    expect(hitsText(2)).toBe('2 HITS');
    expect(hitsText(10)).toBe('10 HITS');
  });
});
