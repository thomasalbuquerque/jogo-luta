/**
 * Seno e cosseno em inteiros, por tabela: Math.sin/cos podem variar entre
 * navegadores e quebrar o determinismo. Ângulos em graus inteiros, resultado
 * multiplicado por TRIG_ONE.
 */
export const TRIG_ONE = 1000;

/** sen(0°..90°) × 1000, arredondado. */
const SIN_0_90: readonly number[] = [
  0, 17, 35, 52, 70, 87, 105, 122, 139, 156, 174, 191, 208, 225, 242, 259, 276, 292, 309, 326, 342,
  358, 375, 391, 407, 423, 438, 454, 469, 485, 500, 515, 530, 545, 559, 574, 588, 602, 616, 629,
  643, 656, 669, 682, 695, 707, 719, 731, 743, 755, 766, 777, 788, 799, 809, 819, 829, 839, 848,
  857, 866, 875, 883, 891, 899, 906, 914, 921, 927, 934, 940, 946, 951, 956, 961, 966, 970, 974,
  978, 982, 985, 988, 990, 993, 995, 996, 998, 999, 999, 1000, 1000,
];

function quarter(deg: number): number {
  return SIN_0_90[deg] ?? 0;
}

/** Normaliza para 0..359. */
export function normDeg(deg: number): number {
  const d = Math.trunc(deg) % 360;
  return d < 0 ? d + 360 : d;
}

/** sen(graus) × TRIG_ONE. */
export function sinDeg(deg: number): number {
  const d = normDeg(deg);
  if (d <= 90) return quarter(d);
  if (d <= 180) return quarter(180 - d);
  // "0 - x" em vez de "-x": evita -0 no estado.
  if (d <= 270) return 0 - quarter(d - 180);
  return 0 - quarter(360 - d);
}

/** cos(graus) × TRIG_ONE. */
export function cosDeg(deg: number): number {
  return sinDeg(deg + 90);
}
