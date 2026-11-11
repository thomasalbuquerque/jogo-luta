import { aliveFighters, cloneState, stepGame, type GameState } from '@jogo-luta/sim';

/** Quantos ticks à frente a previsão olha, no máximo. */
const LOOKAHEAD_TICKS = 240;

/**
 * O golpe que acabou de acertar `victim` decide a luta? Simula à frente numa
 * cópia do estado, sem ninguém apertar nada, enquanto o alvo está sem controle
 * (hitstop e hitstun). Se ele sair da blast zone nesse tempo e isso acabar a
 * luta, é o golpe decisivo. Fora do hitstun ele ainda poderia se salvar: não conta.
 */
export function isDecisiveHit(state: GameState, victim: number): boolean {
  const v = state.fighters[victim];
  if (!v || v.stocks !== 1 || state.phase !== 'fight') return false;
  if (aliveFighters(state).length > 2) return false;
  const sim = cloneState(state);
  const idle = sim.fighters.map(() => 0);
  for (let i = 0; i < LOOKAHEAD_TICKS; i++) {
    stepGame(sim, idle);
    const f = sim.fighters[victim];
    if (!f) return false;
    if (sim.phase === 'over') return f.state === 'ko';
    if (f.state !== 'hitstun' && f.hitstop === 0) return false;
  }
  return false;
}
