import { currentMove, moveFrame, type Fighter } from '@jogo-luta/sim';

/**
 * O "comando" do agarrão com combo (o Comando do Meia): a notação de um golpe de jogo
 * de luta, desenhada em cima da cabeça dele. Só apresentação: o sim não sabe dele.
 */

/** Seta (direção em graus, 0 = direita, 90 = baixo) ou botão redondo com uma letra. */
export type CommandSymbol = { kind: 'arrow'; dir: number } | { kind: 'button'; label: string };

/** ↓ ← B ↘ → ↑ X, com ele virado para a direita. */
export const COMMAND: readonly CommandSymbol[] = [
  { kind: 'arrow', dir: 90 },
  { kind: 'arrow', dir: 180 },
  { kind: 'button', label: 'B' },
  { kind: 'arrow', dir: 45 },
  { kind: 'arrow', dir: 0 },
  { kind: 'arrow', dir: -90 },
  { kind: 'button', label: 'X' },
];

/**
 * O comando visto do lado em que ele está virado: para a esquerda, as setas espelham
 * (← vira →, ↘ vira ↙), como nos jogos de luta. A ordem e os botões não mudam.
 */
export function commandSymbols(facing: -1 | 1): CommandSymbol[] {
  return COMMAND.map((s) =>
    s.kind === 'arrow' && facing === -1 ? { kind: 'arrow', dir: mirror(s.dir) } : s,
  );
}

function mirror(dir: number): number {
  const d = 180 - dir;
  return d > 180 ? d - 360 : d;
}

/** Ticks do recovery em que o comando some depois do arremesso. */
export const COMMAND_FADE_TICKS = 10;
/** Ticks do recovery em que o comando errado treme. */
export const COMMAND_SHAKE_TICKS = 14;

/**
 * Como o comando aparece agora: quantos símbolos acesos (`lit`), se errou (`miss`:
 * vermelho com o X por cima), transparência e se treme. null = não aparece.
 *
 * No startup as setas acendem uma a uma (o último símbolo, o botão, fica para o 1º
 * frame ativo, a janela do agarrão). Se pegou, fica todo aceso durante o combo e some
 * logo depois do arremesso. Se não pegou, fica vermelho no recovery e some no fim.
 */
export function commandLook(
  f: Fighter,
): { lit: number; miss: boolean; alpha: number; shake: boolean } | null {
  if (f.state !== 'attack' || f.move !== 'special') return null;
  const move = currentMove(f);
  if (!move?.grab?.combo) return null;
  const total = COMMAND.length;
  const frame = moveFrame(f);
  const after = frame - move.startup - move.active;
  if (f.moveHits !== 0) {
    // pegou: aceso no combo; depois do arremesso (recovery), some
    if (f.grabTicks > 0 || after <= 0) return { lit: total, miss: false, alpha: 1, shake: false };
    const alpha = 1 - after / COMMAND_FADE_TICKS;
    return alpha > 0 ? { lit: total, miss: false, alpha, shake: false } : null;
  }
  if (frame <= move.startup) {
    const lit = Math.min(total - 1, Math.floor((frame * (total - 1)) / move.startup));
    return { lit, miss: false, alpha: 1, shake: false };
  }
  if (after <= 0) return { lit: total, miss: false, alpha: 1, shake: false };
  // errou: vermelho no recovery, apagando nos últimos ticks
  const left = move.recovery - after;
  const alpha = Math.min(1, left / COMMAND_FADE_TICKS);
  return alpha > 0 ? { lit: total, miss: true, alpha, shake: after <= COMMAND_SHAKE_TICKS } : null;
}

/** Texto do contador do combo: "N HITS" a partir do 2º golpe, como nos jogos de luta. */
export function hitsText(hits: number): string {
  return hits >= 2 ? `${String(hits)} HITS` : '';
}
