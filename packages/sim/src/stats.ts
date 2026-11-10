import { px } from './constants';

/**
 * Números de um lutador, em subpx e ticks.
 * Vêm da ficha do personagem (`character.ts`); o que a ficha não define usa o padrão.
 */
export interface FighterStats {
  width: number;
  height: number;
  /** 100 = médio; maior = voa menos. */
  weight: number;
  walkSpeed: number;
  groundAccel: number;
  groundFriction: number;
  airSpeed: number;
  airAccel: number;
  airFriction: number;
  gravity: number;
  maxFallSpeed: number;
  fastFallSpeed: number;
  /** Altura do pulo do chão (subpx). */
  jumpHeight: number;
  airJumpHeight: number;
  airJumps: number;
  wallSlideSpeed: number;
  wallJumpSpeedX: number;
  wallJumpHeight: number;
  /** Wall jumps por vez no ar (zera ao tocar o chão). */
  maxWallJumps: number;
  dashSpeed: number;
  dashTicks: number;
  dashCooldownTicks: number;
  airDodgeSpeed: number;
  airDodgeTicks: number;
  airDodgeInvulnTicks: number;
}

export const DEFAULT_STATS: FighterStats = {
  width: px(48),
  height: px(96),
  weight: 100,
  walkSpeed: px(6.5),
  groundAccel: px(1.1),
  groundFriction: px(1.4),
  airSpeed: px(5.5),
  airAccel: px(0.6),
  airFriction: px(0.12),
  gravity: px(0.65),
  maxFallSpeed: px(11),
  fastFallSpeed: px(17),
  jumpHeight: px(175),
  airJumpHeight: px(140),
  airJumps: 1,
  wallSlideSpeed: px(3.5),
  wallJumpSpeedX: px(7),
  wallJumpHeight: px(115),
  maxWallJumps: 3,
  dashSpeed: px(13),
  dashTicks: 9,
  dashCooldownTicks: 18,
  airDodgeSpeed: px(10),
  airDodgeTicks: 18,
  airDodgeInvulnTicks: 12,
};
