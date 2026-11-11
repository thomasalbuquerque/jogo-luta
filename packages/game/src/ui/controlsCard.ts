import Phaser from 'phaser';
import type { ButtonName } from '@jogo-luta/sim';
import { padButtonLabel, keyLabel, type Controls } from '../input/controls';
import type { PadAction } from '../input/bindings';
import { cssColor, panel, playerColor, UI, uiText } from './theme';

/** Nome de cada botão na tela. */
export const BUTTON_LABELS: Readonly<Record<ButtonName, string>> = {
  LEFT: 'Esquerda',
  RIGHT: 'Direita',
  UP: 'Cima',
  DOWN: 'Baixo',
  JUMP: 'Pular',
  ATTACK: 'Ataque',
  SPECIAL: 'Especial',
  DODGE: 'Esquiva',
  TAUNT: 'Provocação',
};

/** Teclas de um botão, separadas por barra. */
export function keysText(codes: readonly string[]): string {
  return codes.map(keyLabel).join(' / ');
}

export function padText(buttons: readonly number[]): string {
  return buttons.map(padButtonLabel).join(' / ');
}

const ROWS: readonly (readonly [string, (c: Controls, p: number) => string, PadAction | null])[] = [
  [
    'Andar e mirar',
    (c, p) => {
      const k = c.keys[p];
      return k ? [k.UP, k.LEFT, k.DOWN, k.RIGHT].map((x) => keysText(x)).join(' ') : '';
    },
    null,
  ],
  ['Pular', (c, p) => keysText(c.keys[p]?.JUMP ?? []), 'JUMP'],
  ['Ataque', (c, p) => keysText(c.keys[p]?.ATTACK ?? []), 'ATTACK'],
  ['Especial', (c, p) => keysText(c.keys[p]?.SPECIAL ?? []), 'SPECIAL'],
  ['Esquiva', (c, p) => keysText(c.keys[p]?.DODGE ?? []), 'DODGE'],
  ['Provocação', (c, p) => keysText(c.keys[p]?.TAUNT ?? []), 'TAUNT'],
];

/** Cartão de consulta com os controles atuais de P1, P2 e do controle (pausa). */
export function drawControlsCard(
  scene: Phaser.Scene,
  controls: Controls,
  x: number,
  y: number,
  depth = 0,
): void {
  const w = 560;
  const rowH = 34;
  const h = 64 + ROWS.length * rowH + 16;
  const g = scene.add.graphics().setDepth(depth);
  panel(g, x, y, w, h, UI.panelDark, 0.92);
  const cols = [x + 20, x + 190, x + 330, x + 460];
  const add = (cx: number, cy: number, text: string, color: string = UI.text, bold = false) =>
    uiText(scene, cx, cy, text, {
      fontSize: '17px',
      fontStyle: bold ? 'bold' : 'normal',
      color,
    }).setDepth(depth + 1);
  add(cols[0] ?? x, y + 18, 'CONTROLES', UI.muted, true);
  add(cols[1] ?? x, y + 18, 'P1', cssColor(playerColor(0)), true);
  add(cols[2] ?? x, y + 18, 'P2', cssColor(playerColor(1)), true);
  add(cols[3] ?? x, y + 18, 'Controle', UI.muted, true);
  ROWS.forEach(([label, keys, pad], i) => {
    const ry = y + 60 + i * rowH;
    add(cols[0] ?? x, ry, label, UI.muted);
    add(cols[1] ?? x, ry, keys(controls, 0));
    add(cols[2] ?? x, ry, keys(controls, 1));
    add(cols[3] ?? x, ry, pad ? padText(controls.pad[pad]) : 'Analógico');
  });
}
