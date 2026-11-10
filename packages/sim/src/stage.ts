import { px } from './constants';
import type { Box, Solid } from './physics';

export interface Spawn {
  /** Centro dos pés, em subpx. */
  x: number;
  y: number;
}

export interface Stage {
  id: string;
  solids: readonly Solid[];
  spawns: readonly Spawn[];
  /** Sair desta caixa = KO (na Etapa 1, só volta ao spawn). */
  blastZone: Box;
}

function solid(kind: Solid['kind'], x: number, y: number, w: number, h: number): Solid {
  return { kind, x: px(x), y: px(y), w: px(w), h: px(h) };
}

/**
 * Mapa de teste: plataforma principal grossa (as laterais servem de parede para
 * wall jump) e 2 plataformas atravessáveis acima dela. Origem no centro do topo
 * da plataforma principal.
 */
export const TEST_STAGE: Stage = {
  id: 'test',
  solids: [
    solid('solid', -450, 0, 900, 420),
    solid('platform', -380, -150, 230, 16),
    solid('platform', 150, -150, 230, 16),
  ],
  spawns: [
    { x: px(-200), y: 0 },
    { x: px(200), y: 0 },
    { x: px(-320), y: px(-150) },
    { x: px(320), y: px(-150) },
  ],
  blastZone: { x: px(-1300), y: px(-1000), w: px(2600), h: px(1800) },
};
