import {
  getCharacter,
  toPx,
  type AnimationKey,
  type Character,
  type Fighter,
} from '@jogo-luta/sim';

/** '#rrggbb' → número que o Phaser usa (0xrrggbb). */
export function colorValue(hex: string): number {
  return Number.parseInt(hex.slice(1), 16);
}

/**
 * Animação que o lutador deveria tocar agora (Etapa 4). Cada estado tem a sua;
 * no golpe, é o próprio golpe (ou `special`).
 */
export function animationKey(f: Fighter): AnimationKey {
  if (f.state === 'attack') return f.move ?? 'idle';
  return f.state;
}

export interface StatBar {
  label: string;
  /** 0..1 */
  value: number;
}

function bar(label: string, value: number, min: number, max: number): StatBar {
  return { label, value: Math.min(1, Math.max(0, (value - min) / (max - min))) };
}

/** Barras da tela de seleção: só para comparar os personagens de relance. */
export function statBars(c: Character): StatBar[] {
  const s = c.stats;
  return [
    bar('Peso', s.weight, 60, 140),
    bar('Chão', toPx(s.walkSpeed), 4, 9),
    bar('Ar', toPx(s.airSpeed) + s.airJumps, 5, 9.5),
    bar('Pulo', toPx(s.jumpHeight), 120, 220),
  ];
}

/** Ficha do lutador (atalho para o render). */
export function characterOfFighter(f: Fighter): Character {
  return getCharacter(f.character);
}
