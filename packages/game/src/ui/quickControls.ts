import type { ButtonName } from '@jogo-luta/sim';
import { PAD_SELECT } from '../input/bindings';
import { keyLabel, padButtonLabel, type Controls } from '../input/controls';

/**
 * Cola de comandos na luta: um ícone no canto (Tab no teclado, Select no
 * controle) abre por alguns segundos um cartão com os comandos básicos, nas
 * teclas ou nos botões de quem apertou. O detalhe dos golpes fica no tutorial.
 */

/** Com o que a pessoa abriu a cola: o cartão mostra as teclas ou os botões dele. */
export type QuickDevice = 'keyboard' | 'pad';

/** Tecla que abre a cola (reservada: nenhum botão do jogo usa). */
export const QUICK_KEY = 'Tab';
/** Botão do controle que abre a cola (reservado; a pausa fica no Start). */
export const QUICK_PAD_BUTTON = PAD_SELECT;

/** Quanto tempo a cola fica na tela antes de sumir sozinha (ms). */
export const QUICK_SHOW_MS = 7000;

export interface QuickRow {
  label: string;
  /** Uma coluna por jogador (teclado) ou só a do controle. */
  values: string[];
}

const ROWS: readonly (readonly [string, ButtonName])[] = [
  ['Pular', 'JUMP'],
  ['Ataque', 'ATTACK'],
  ['Especial', 'SPECIAL'],
  ['Esquiva', 'DODGE'],
  ['Provocar', 'TAUNT'],
];

function keysOf(controls: Controls, player: number, name: ButtonName): string {
  return (controls.keys[player]?.[name] ?? []).map(keyLabel).join(' / ');
}

function padOf(controls: Controls, name: ButtonName): string {
  if (name === 'LEFT' || name === 'RIGHT' || name === 'UP' || name === 'DOWN') return '';
  return controls.pad[name].map(padButtonLabel).join(' / ');
}

/** Cabeçalho das colunas: P1, P2… (teclado) ou "Controle". */
export function quickHeaders(device: QuickDevice, players: readonly number[]): string[] {
  return device === 'pad' ? ['Controle'] : players.map((p) => `P${String(p + 1)}`);
}

/**
 * Linhas da cola: andar e os botões, com as teclas de cada jogador do teclado
 * (`players`: P1 e P2 no jogo local, só o P1 online) ou os botões do controle.
 */
export function quickRows(
  controls: Controls,
  device: QuickDevice,
  players: readonly number[],
): QuickRow[] {
  const walk: QuickRow = {
    label: 'Andar',
    values:
      device === 'pad'
        ? ['Analógico/D-pad']
        : players.map((p) =>
            (['UP', 'LEFT', 'DOWN', 'RIGHT'] as const).map((n) => keysOf(controls, p, n)).join(' '),
          ),
  };
  const buttons = ROWS.map(([label, name]) => ({
    label,
    values:
      device === 'pad' ? [padOf(controls, name)] : players.map((p) => keysOf(controls, p, name)),
  }));
  return [walk, ...buttons];
}

/** Dica de movimento que vale em qualquer aparelho: a parede. */
export const QUICK_NOTES: readonly (readonly [string, string])[] = [
  ['Parede', 'no ar, segure nela; Pular salta (3×)'],
];

export const QUICK_FOOTER = 'Ataque + direção muda o golpe · Como jogar';

/** Rótulo do botão de abrir a cola em cada aparelho. */
export function quickButtonLabel(device: QuickDevice): string {
  return device === 'pad' ? padButtonLabel(QUICK_PAD_BUTTON) : QUICK_KEY;
}
