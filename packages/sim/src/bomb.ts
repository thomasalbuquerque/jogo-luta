import { canBeHit, isFoe, launch } from './combat';
import type { BombEvent, GameEvent, HitEvent } from './events';
import { characterOf, hasAura, type Fighter } from './fighter';
import { idiv, isqrt } from './math';
import type { BombDef } from './moves';
import { overlaps, type Box } from './physics';

/**
 * Bomba com relógio (o especial do Thom4o, bloco `grab` com `bomb`).
 *
 * O arremesso do agarrão cola a bomba no alvo. Quem está com ela passa para outro
 * lutador acertando um golpe de corpo nele (golpe base, investida, área, agarrão ou o
 * golpe devolvido do contra-ataque; projétil não passa). Quem acabou de passar (ou de
 * plantar) não recebe de volta por `lockTicks`, e passar com pouco tempo no relógio
 * devolve o relógio ao piso (`floorTicks`). Quando o relógio zera, estoura em quem
 * estiver com ela e machuca quem estiver em volta (inclusive o dono). Se quem está com
 * ela perder a vida, ela some.
 *
 * Só inteiros e nenhuma sorte: replay e online continuam iguais.
 */
export interface Bomb {
  /** Id do lutador que plantou (de onde vêm os números, `BombDef`). */
  owner: number;
  /** Id de quem está com a bomba. */
  carrier: number;
  /** Ticks até estourar. */
  ticksLeft: number;
  /** Quem não pode receber a bomba agora (quem passou por último ou plantou); -1 = ninguém. */
  locked: number;
  /** Ticks até a trava de `locked` acabar. */
  lockTicks: number;
}

/** O que a bomba lê do resto da luta. */
export interface BombWorld {
  fighters: readonly Fighter[];
  bombs: Bomb[];
  /** Companheiros de time se acertam (a área da explosão também). */
  friendlyFire: boolean;
}

/** Números da bomba de um lutador (o especial dele é um agarrão com bomba), ou null. */
export function bombDefOf(f: Pick<Fighter, 'character'>): BombDef | null {
  return characterOf(f).special?.move.grab?.bomb ?? null;
}

/** A bomba que está com o lutador, se houver (cada um carrega 1 no máximo). */
export function bombOn(bombs: readonly Bomb[], fighterId: number): Bomb | undefined {
  return bombs.find((b) => b.carrier === fighterId);
}

function center(f: Fighter): { x: number; y: number } {
  return { x: f.x + idiv(f.w, 2), y: f.y + idiv(f.h, 2) };
}

function bombEvent(
  action: BombEvent['action'],
  b: Bomb,
  carrier: Fighter,
  from = b.owner,
): BombEvent {
  const { x, y } = center(carrier);
  return { type: 'bomb', action, owner: b.owner, carrier: b.carrier, from, x, y };
}

/** Golpes que passam a bomba: os de corpo (projétil não passa: ela está colada). */
const BODY_HITS: ReadonlySet<HitEvent['kind']> = new Set(['hit', 'counter', 'throw', 'combo']);

/**
 * Um tick das bombas, depois dos golpes, agarrões e KOs. Lê os acertos do tick em
 * `events` (para passar e plantar) e escreve os eventos da bomba lá.
 */
export function stepBombs(world: BombWorld, events: GameEvent[]): void {
  const hits = events.filter((e): e is HitEvent => e.type === 'hit');
  passBombs(world, hits, events);
  plantBombs(world, hits, events);
  tickBombs(world, events);
}

/** Golpe de corpo de quem está com a bomba, em alguém sem bomba e sem trava: a bomba vai junto. */
function passBombs(world: BombWorld, hits: readonly HitEvent[], events: GameEvent[]): void {
  for (const b of world.bombs) {
    const owner = world.fighters[b.owner];
    const def = owner && bombDefOf(owner);
    if (!def) continue;
    const hit = hits.find(
      (h) =>
        BODY_HITS.has(h.kind) &&
        h.attacker === b.carrier &&
        h.victim !== b.locked &&
        world.fighters[h.victim]?.state !== 'ko' &&
        !bombOn(world.bombs, h.victim),
    );
    const victim = hit && world.fighters[hit.victim];
    if (!hit || !victim) continue;
    const from = b.carrier;
    b.carrier = victim.id;
    b.locked = from;
    b.lockTicks = def.lockTicks;
    b.ticksLeft = Math.max(b.ticksLeft, def.floorTicks);
    events.push(bombEvent('pass', b, victim, from));
  }
}

/**
 * Arremesso de um agarrão com bomba: cola uma bomba nova no alvo, se o dono não tiver
 * outra em jogo e o alvo não estiver com nenhuma (o agarrão pega, mas não cola).
 */
function plantBombs(world: BombWorld, hits: readonly HitEvent[], events: GameEvent[]): void {
  for (const h of hits) {
    if (h.kind !== 'throw') continue;
    const owner = world.fighters[h.attacker];
    const victim = world.fighters[h.victim];
    const def = owner && bombDefOf(owner);
    if (!owner || !victim || !def || victim.state === 'ko') continue;
    if (world.bombs.some((b) => b.owner === owner.id) || bombOn(world.bombs, victim.id)) continue;
    const b: Bomb = {
      owner: owner.id,
      carrier: victim.id,
      ticksLeft: def.fuseTicks,
      locked: owner.id,
      lockTicks: def.lockTicks,
    };
    world.bombs.push(b);
    events.push(bombEvent('plant', b, victim));
  }
}

/**
 * Relógio e trava andam; com o relógio em 0, estoura. Quem está com a bomba e perdeu a
 * vida leva ela junto (some, sem estourar). Enquanto a bomba do dono está em jogo, o
 * especial dele fica recarregando com a recarga da bomba: ele não planta outra e,
 * quando ela sai de jogo, a recarga conta dali.
 */
function tickBombs(world: BombWorld, events: GameEvent[]): void {
  let alive = 0;
  for (const b of world.bombs) {
    const owner = world.fighters[b.owner];
    const carrier = world.fighters[b.carrier];
    const def = owner && bombDefOf(owner);
    if (!owner || !carrier || !def) continue;
    if (carrier.state === 'ko') {
      events.push(bombEvent('vanish', b, carrier));
      owner.specialCooldown = Math.max(owner.specialCooldown, def.cooldownTicks);
      continue;
    }
    if (b.lockTicks > 0 && --b.lockTicks === 0) b.locked = -1;
    if (b.ticksLeft > 0) b.ticksLeft--;
    if (b.ticksLeft === 0) {
      explode(world, b, def, owner, carrier, events);
      owner.specialCooldown = Math.max(owner.specialCooldown, def.cooldownTicks);
      continue;
    }
    owner.specialCooldown = Math.max(owner.specialCooldown, def.cooldownTicks);
    world.bombs[alive++] = b;
  }
  world.bombs.length = alive;
}

/** Área da explosão: a caixa `areaW × areaH` centrada no corpo de quem está com a bomba. */
export function blastArea(def: BombDef, carrier: Fighter): Box {
  const { x, y } = center(carrier);
  return { x: x - idiv(def.areaW, 2), y: y - idiv(def.areaH, 2), w: def.areaW, h: def.areaH };
}

/**
 * Estoura: quem está com a bomba leva o golpe cheio (não dá para esquivar, está
 * colada); quem está na área (inclusive o dono) leva o golpe da área, para longe do
 * portador. Esquiva e invencibilidade salvam quem está em volta. Sem fogo amigo, a área
 * poupa os companheiros do dono (o portador leva sempre).
 */
function explode(
  world: BombWorld,
  b: Bomb,
  def: BombDef,
  owner: Fighter,
  carrier: Fighter,
  events: GameEvent[],
): void {
  events.push(bombEvent('explode', b, carrier));
  const at = center(carrier);
  const area = blastArea(def, carrier);
  const caught = world.fighters.filter(
    (f) =>
      f !== carrier &&
      (f === owner || isFoe(owner, f, world.friendlyFire)) &&
      canBeHit(f) &&
      !hasAura(f) &&
      overlaps(area, f),
  );
  blast(carrier, def.carrierHit, 1, owner.id, at, events);
  for (const f of caught) {
    const c = center(f);
    const side = c.x === at.x ? (f.facing === 1 ? -1 : 1) : c.x > at.x ? 1 : -1;
    blast(f, def.areaHit, side, owner.id, c, events);
  }
}

function blast(
  victim: Fighter,
  hit: BombDef['carrierHit'],
  side: -1 | 1,
  attacker: number,
  at: { x: number; y: number },
  events: GameEvent[],
): void {
  const { stop, taken } = launch(victim, hit, side, hit.damage);
  victim.hitstop = Math.max(victim.hitstop, stop);
  const e: HitEvent = {
    type: 'hit',
    kind: 'bomb',
    attacker,
    victim: victim.id,
    damage: taken,
    knockback: isqrt(victim.kbx * victim.kbx + victim.kby * victim.kby),
    x: at.x,
    y: at.y,
  };
  if (taken < hit.damage) e.reduced = true;
  events.push(e);
}
