/** Raiz quadrada inteira (piso), sem Math.sqrt: determinística. */
export function isqrt(n: number): number {
  if (n < 0) throw new RangeError('isqrt de número negativo');
  if (n < 2) return n;
  let x = n;
  let y = Math.floor((x + 1) / 2);
  while (y < x) {
    x = y;
    y = Math.floor((x + Math.floor(n / x)) / 2);
  }
  return x;
}

/** Aproxima `value` de `target` em no máximo `step` (step >= 0). */
export function approach(value: number, target: number, step: number): number {
  if (value < target) return Math.min(value + step, target);
  if (value > target) return Math.max(value - step, target);
  return value;
}

/** Divisão inteira que trunca em direção a zero. */
export function idiv(a: number, b: number): number {
  // "+ 0": -1 ÷ 2 truncado daria -0
  return Math.trunc(a / b) + 0;
}
