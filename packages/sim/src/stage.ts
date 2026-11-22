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

/** Rampa na diagonal da caixa, com o lado alto em `up` (ver `SolidKind`). */
function ramp(x: number, y: number, w: number, h: number, up: -1 | 1): Solid {
  return { ...solid('ramp', x, y, w, h), up };
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
 * Oficina do Tchula: chão mais largo que o da laje e uma passarela larga só, no
 * meio (pendurada por correntes, na arte). Ver docs/CENARIOS.md.
 */
export const OFICINA_STAGE: Stage = {
  id: 'oficina',
  solids: [solid('solid', -500, 0, 1000, 420), solid('platform', -190, -150, 380, 16)],
  spawns: [
    { x: px(-240), y: 0 },
    { x: px(240), y: 0 },
    { x: px(-110), y: px(-150) },
    { x: px(110), y: px(-150) },
  ],
  respawns: [
    { x: px(-100), y: px(-420) },
    { x: px(100), y: px(-420) },
    { x: px(-260), y: px(-420) },
    { x: px(260), y: px(-420) },
  ],
  blastZone: { x: px(-1350), y: px(-1000), w: px(2700), h: px(1800) },
};

/**
 * Confeitaria do Darllan: dois blocos sólidos encostados, a bancada comprida e,
 * na ponta direita, o forno, 65 px mais alto (um degrau baixo, de um pulo só,
 * onde também se luta). Os pés das duas caixas ficam na mesma linha. Por cima da
 * metade esquerda da bancada, um biscoito gigante atravessável. Outro biscoito,
 * encostado no forno, é a rampa da bancada até o topo dele (uns 25°: sobe os 65 px
 * em 140), para passar de um para o outro andando. Ver docs/CENARIOS.md.
 */
export const CONFEITARIA_STAGE: Stage = {
  id: 'confeitaria',
  solids: [
    solid('solid', -520, 0, 700, 420),
    solid('solid', 180, -65, 340, 485),
    solid('platform', -440, -150, 270, 16),
    ramp(40, -65, 140, 65, 1),
  ],
  spawns: [
    { x: px(-300), y: 0 },
    // fora de baixo da rampa
    { x: px(0), y: 0 },
    { x: px(-305), y: px(-150) },
    { x: px(350), y: px(-65) },
  ],
  respawns: [
    { x: px(-100), y: px(-420) },
    { x: px(100), y: px(-420) },
    { x: px(-260), y: px(-420) },
    { x: px(260), y: px(-420) },
  ],
  blastZone: { x: px(-1370), y: px(-1000), w: px(2740), h: px(1800) },
};

/** Mapas do jogo, na ordem da tela de seleção. */
export const STAGES: readonly Stage[] = [TEST_STAGE, OFICINA_STAGE, CONFEITARIA_STAGE];
