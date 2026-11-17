/**
 * Contas do relógio da bomba do Thom4o na tela (sem Phaser, para testar): o texto do
 * relógio e o ritmo do bipe.
 */

/** Último segundo (ticks): o relógio fica vermelho e o anel da área aparece no chão. */
export const LAST_SECOND_TICKS = 60;

/**
 * Ticks entre um bipe e outro, com `ticksLeft` no relógio: começa devagar (uns 0,7 s)
 * e acelera até quase colar no fim.
 */
export function beepInterval(ticksLeft: number): number {
  return Math.max(5, Math.min(42, Math.round(ticksLeft / 6)));
}

/** Relógio em segundos com 1 casa, com vírgula ("4,9"); nunca mostra "0,0" antes do fim. */
export function clockText(ticksLeft: number): string {
  const tenths = Math.max(1, Math.ceil(ticksLeft / 6));
  return `${String(Math.floor(tenths / 10))},${String(tenths % 10)}`;
}
