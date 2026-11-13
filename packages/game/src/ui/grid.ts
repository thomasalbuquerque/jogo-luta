import { Menu, type MenuMask } from '../input/menu';

/**
 * Casas da tela de seleção. São 16 amigos, mas por enquanto a grade mostra só
 * 7 (os que já existem e silhuetas "em breve"); o número cresce aos poucos.
 */
export const SELECT_SLOTS = 7;

/** Id de cada casa da grade; null = silhueta "em breve". */
export function selectSlots(playable: readonly string[], total = SELECT_SLOTS): (string | null)[] {
  const n = Math.max(total, playable.length);
  return Array.from({ length: n }, (_, i) => playable[i] ?? null);
}

/** Colunas da grade: tudo numa linha até 8 casas, depois linhas de 8. */
export function gridColumns(count: number): number {
  return Math.min(count, 8);
}

/**
 * Medidas da tela de seleção (px da tela de 1280×720). Até 8 casas, uma linha de
 * casas grandes; com mais, duas linhas de casas mais baixas (cabe o elenco todo, 16),
 * e os painéis dos jogadores começam mais embaixo, com o lutador um pouco menor. O pé
 * dos painéis fica sempre no mesmo lugar, acima do rodapé.
 */
export interface SelectLayout {
  cols: number;
  rows: number;
  tileW: number;
  tileH: number;
  gap: number;
  /** Topo da 1ª linha de casas. */
  gridY: number;
  /** Na casa: centro e tamanho da figurinha, altura da faixa colorida, linha do nome. */
  portraitY: number;
  portraitSize: number;
  bandH: number;
  nameY: number;
  nameSize: number;
  silhouetteY: number;
  silhouetteSize: number;
  panelY: number;
  panelH: number;
  /** Altura do lutador no painel largo (2 jogadores) e no estreito (3 ou 4). */
  fighterH: number;
  compactFighterH: number;
  /** Onde ficam os pés do lutador no painel estreito. */
  compactFloorY: number;
  /** Linhas do texto no painel largo: nome, estilo, especial, barras e bordão. */
  textY: { name: number; blurb: number; special: number; bars: number; quote: number };
}

export function selectLayout(count: number): SelectLayout {
  const cols = gridColumns(count);
  const rows = Math.ceil(count / Math.max(1, cols));
  if (rows <= 1) {
    return {
      cols,
      rows,
      tileW: 136,
      tileH: 150,
      gap: 14,
      gridY: 92,
      portraitY: 58,
      portraitSize: 104,
      bandH: 110,
      nameY: 132,
      nameSize: 15,
      silhouetteY: 62,
      silhouetteSize: 92,
      panelY: 276,
      panelH: 368,
      fighterH: 290,
      compactFighterH: 190,
      compactFloorY: 238,
      textY: { name: 28, blurb: 80, special: 146, bars: 190, quote: 300 },
    };
  }
  return {
    cols,
    rows,
    tileW: 136,
    tileH: 104,
    gap: 10,
    gridY: 84,
    portraitY: 38,
    portraitSize: 66,
    bandH: 72,
    nameY: 89,
    nameSize: 14,
    silhouetteY: 40,
    silhouetteSize: 58,
    panelY: 84 + rows * 104 + (rows - 1) * 10 + 12,
    panelH: 644 - (84 + rows * 104 + (rows - 1) * 10 + 12),
    fighterH: 258,
    compactFighterH: 156,
    compactFloorY: 202,
    textY: { name: 22, blurb: 70, special: 128, bars: 166, quote: 270 },
  };
}

/**
 * Move o cursor na grade: ←/→ anda uma casa (dá a volta na grade inteira),
 * ↑/↓ troca de linha na mesma coluna (se a casa existir).
 */
export function gridMove(index: number, actions: MenuMask, cols: number, count: number): number {
  let i = index;
  if (actions & Menu.LEFT) i = (i - 1 + count) % count;
  if (actions & Menu.RIGHT) i = (i + 1) % count;
  if (actions & Menu.UP && i - cols >= 0) i -= cols;
  if (actions & Menu.DOWN && i + cols < count) i += cols;
  return i;
}
