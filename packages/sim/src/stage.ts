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
  /** Onde cada jogador começa a luta. */
  spawns: readonly Spawn[];
  /** Onde cada jogador reaparece depois de um KO (no alto do mapa). */
  respawns: readonly Spawn[];
  /** Sair inteiro desta caixa = KO. */
  blastZone: Box;
}

function solid(kind: Solid['kind'], x: number, y: number, w: number, h: number): Solid {
  return { kind, x: px(x), y: px(y), w: px(w), h: px(h) };
}

/**
 * Mapa de teste: plataforma principal grossa (as laterais servem de parede para
 * wall jump e as quinas de cima são bordas que dá para agarrar) e 2 plataformas
 * atravessáveis acima dela. Origem no centro do topo da plataforma principal.
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
  respawns: [
    { x: px(-100), y: px(-420) },
    { x: px(100), y: px(-420) },
    { x: px(-260), y: px(-420) },
    { x: px(260), y: px(-420) },
  ],
  blastZone: { x: px(-1300), y: px(-1000), w: px(2600), h: px(1800) },
};

/**
 * Laje lisa: o mesmo prédio do mapa de teste, sem as plataformas atravessáveis.
 * Luta no chão, sem onde se esconder.
 */
export const FLAT_STAGE: Stage = {
  ...TEST_STAGE,
  id: 'flat',
  solids: [solid('solid', -450, 0, 900, 420)],
  spawns: [
    { x: px(-200), y: 0 },
    { x: px(200), y: 0 },
    { x: px(-340), y: 0 },
    { x: px(340), y: 0 },
  ],
};

/** Mapas do jogo, na ordem da tela de seleção. */
export const STAGES: readonly Stage[] = [TEST_STAGE, FLAT_STAGE];
