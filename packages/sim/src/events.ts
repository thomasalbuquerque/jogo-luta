/**
 * Acontecimentos de um tick, para o render tocar som e efeitos. O sim só
 * escreve: nenhuma regra do jogo lê os eventos. `stepGame` limpa a lista no
 * começo de cada tick.
 */
export type GameEvent = HitEvent | GrabEvent | KoEvent | RespawnEvent | ActionEvent;

/**
 * Alguém levou um golpe. `hit`: golpe normal; `counter`: devolvido pelo
 * contra-ataque (`attacker` é quem contra-atacou); `throw`: arremesso do
 * agarrão; `projectile`: projétil (`attacker` é o dono).
 */
export interface HitEvent {
  type: 'hit';
  kind: 'hit' | 'counter' | 'throw' | 'projectile';
  attacker: number;
  victim: number;
  /** Dano causado, em %. */
  damage: number;
  /** Velocidade do arremesso, em subpx/tick. */
  knockback: number;
  /** Ponto do impacto, em subpx. */
  x: number;
  y: number;
}

export interface GrabEvent {
  type: 'grab';
  attacker: number;
  victim: number;
}

/** Saiu da blast zone. `x`/`y`: centro do corpo ao sair (subpx). */
export interface KoEvent {
  type: 'ko';
  fighter: number;
  x: number;
  y: number;
  stocksLeft: number;
}

export interface RespawnEvent {
  type: 'respawn';
  fighter: number;
}

/** Ação do próprio lutador (bits de `Cue`). */
export interface ActionEvent {
  type: 'action';
  fighter: number;
  action: CueName;
}

/**
 * Sinais que o lutador marca em `Fighter.cues` durante o tick (bitmask). Viram
 * `ActionEvent` no fim do tick.
 */
export const Cue = {
  JUMP: 1 << 0,
  AIR_JUMP: 1 << 1,
  WALL_JUMP: 1 << 2,
  DASH: 1 << 3,
  AIR_DODGE: 1 << 4,
  LAND: 1 << 5,
  /** Começou um golpe (inclui o especial). */
  SWING: 1 << 6,
  TAUNT: 1 << 7,
} as const;

export type CueName = keyof typeof Cue;

const CUE_NAMES = Object.keys(Cue) as CueName[];

/** Nomes dos bits ligados em `cues`, na ordem de `Cue`. */
export function cueNames(cues: number): CueName[] {
  return CUE_NAMES.filter((name) => (cues & Cue[name]) !== 0);
}
