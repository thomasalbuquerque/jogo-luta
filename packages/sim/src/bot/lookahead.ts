import { activeHitboxes } from '../combat';
import { Cue } from '../events';
import { stepFighter, type Fighter } from '../fighter';
import { NO_INPUT, type InputMask } from '../input';
import { overlaps, type Box } from '../physics';
import { stepProjectiles, type Projectile } from '../projectile';
import { isOffstage, type Terrain } from './terrain';

/**
 * Olhar para a frente: o bot roda uma cópia do lutador (só ele, sem os outros)
 * com inputs de mentira para saber o que vai acontecer. É o mesmo `stepFighter`
 * da luta, então pulo, gravidade, impulso dos golpes e hitboxes saem certos para
 * qualquer personagem, sem número escrito à mão.
 */

/** Cópia solta de um lutador (as `stats` vêm da ficha e ninguém altera). */
export function cloneFighter(f: Fighter): Fighter {
  return { ...f };
}

/**
 * Caminho previsto de um lutador sem ninguém mexer nele (sem input): a caixa do
 * corpo depois de cada tick. `path[k]` = depois de k + 1 ticks.
 */
export function predictPath(f: Fighter, terrain: Terrain, ticks: number): Box[] {
  const c = cloneFighter(f);
  const path: Box[] = [];
  for (let k = 0; k < ticks; k++) {
    if (c.state !== 'ko') stepFighter(c, NO_INPUT, terrain.solids);
    path.push({ x: c.x, y: c.y, w: c.w, h: c.h });
  }
  return path;
}

/** Avança a cópia de um lutador `ticks` ticks sem input (a posição que o bot prevê). */
export function predictFighter(f: Fighter, terrain: Terrain, ticks: number): Fighter {
  const c = cloneFighter(f);
  for (let k = 0; k < ticks && c.state !== 'ko'; k++) stepFighter(c, NO_INPUT, terrain.solids);
  return c;
}

export interface ProbeResult {
  /** Ticks até acertar o alvo (1 = no próximo tick), ou -1 se não acerta. */
  hit: number;
  /** Termina o golpe fora do palco (no ar, sem chão embaixo): arriscado. */
  unsafe: boolean;
}

/**
 * Testa um golpe: aperta `press` por 2 ticks e depois segura `hold`, e vê se
 * alguma hitbox (ou projétil) encosta no caminho previsto do alvo. Continua até o
 * golpe acabar para saber onde o lutador termina.
 */
export function probeMove(
  me: Fighter,
  terrain: Terrain,
  press: InputMask,
  hold: InputMask,
  target: readonly Box[],
  maxTicks: number,
): ProbeResult {
  const f = cloneFighter(me);
  // o aperto tem que contar como aperto (o bot solta o botão antes de apertar de verdade)
  f.prevInput = NO_INPUT;
  const projectiles: Projectile[] = [];
  const blast = terrain.stage.blastZone;
  let hit = -1;
  let started = false;
  for (let t = 0; t < maxTicks; t++) {
    stepFighter(f, t < 2 ? press : hold, terrain.solids, projectiles);
    stepProjectiles(projectiles, terrain.solids, blast);
    // começou o golpe novo (um golpe que já estava no fim não conta)
    if (f.cues & Cue.SWING) started = true;
    const box = target[Math.min(t, target.length - 1)];
    if (started && hit < 0 && box) {
      if (f.state === 'attack' && activeHitboxes(f).some((h) => overlaps(h, box))) hit = t + 1;
      else if (projectiles.some((p) => overlaps(p, box))) hit = t + 1;
    }
    // golpe acabou: o resto não interessa (projétil ainda voando continua)
    if (started && f.state !== 'attack' && (hit >= 0 || projectiles.length === 0)) break;
    if (!started && t >= 8) break; // não saiu (preso, sem especial…)
  }
  return { hit, unsafe: !f.grounded && f.state !== 'ledge' && isOffstage(terrain, f) };
}
