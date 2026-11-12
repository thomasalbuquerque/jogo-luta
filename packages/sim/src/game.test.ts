import { describe, expect, it } from 'vitest';
import { canBeHit } from './combat';
import { px } from './constants';
import type { Fighter } from './fighter';
import {
  COUNTDOWN_TICKS,
  createGame,
  DEFAULT_RULES,
  getStage,
  MATCH_RULES,
  RESPAWN_DELAY_TICKS,
  RESPAWN_INVULN_TICKS,
  SUDDEN_DEATH_DAMAGE,
  stepGame,
  type GameState,
} from './game';
import { Button } from './input';
import { cloneState } from './snapshot';
import { STAGES, TEST_STAGE } from './stage';

function fighter(g: GameState, id: number): Fighter {
  const f = g.fighters[id];
  if (!f) throw new Error(`sem lutador ${String(id)}`);
  return f;
}

describe('game', () => {
  it('cria 2 lutadores no chão do mapa de teste, virados um para o outro', () => {
    const g = createGame();
    expect(g.fighters).toHaveLength(2);
    for (let i = 0; i < 3; i++) stepGame(g, [0, 0]);
    expect(g.tick).toBe(3);
    expect(g.fighters.every((f) => f.grounded)).toBe(true);
    expect(g.fighters[0]?.facing).toBe(1);
    expect(g.fighters[1]?.facing).toBe(-1);
  });

  it('um pulo cheio alcança a plataforma atravessável', () => {
    const g = createGame();
    stepGame(g, [0, 0]); // primeiro tick: encosta no chão
    for (let i = 0; i < 30; i++) stepGame(g, [Button.JUMP, 0]);
    for (let i = 0; i < 60; i++) stepGame(g, [0, 0]);
    const f = g.fighters[0];
    expect(f?.grounded).toBe(true);
    expect(f?.onPlatform).toBe(true);
  });

  it('começa com 3 stocks e 0% para cada um', () => {
    const g = createGame();
    for (const f of g.fighters) {
      expect(f.stocks).toBe(DEFAULT_RULES.stocks);
      expect(f.damage).toBe(0);
    }
  });

  it('sair da blast zone é KO: perde 1 stock e sai de cena', () => {
    const g = createGame();
    const f = fighter(g, 0);
    f.damage = 87;
    f.x = px(-1500);
    stepGame(g, [0, 0]);
    expect(f.state).toBe('ko');
    expect(f.stocks).toBe(DEFAULT_RULES.stocks - 1);
    expect(f.damage).toBe(0);
  });

  it('reaparece no alto depois do atraso, com 0% e invencível', () => {
    const g = createGame();
    const f = fighter(g, 0);
    f.y = px(1200);
    stepGame(g, [0, 0]);
    for (let i = 0; i < RESPAWN_DELAY_TICKS - 1; i++) stepGame(g, [0, 0]);
    expect(f.state).toBe('ko');
    stepGame(g, [0, 0]);
    expect(f.state).not.toBe('ko');
    const point = TEST_STAGE.respawns[0];
    expect(f.x + f.w / 2).toBe(point?.x);
    expect(f.y + f.h).toBeLessThan(px(-300));
    expect(f.invulnTicks).toBeGreaterThan(RESPAWN_INVULN_TICKS - 5);
  });

  it('em KO não leva golpe; sem stock, não volta mais', () => {
    const g = createGame({ rules: { stocks: 1, timeLimitTicks: 0 } });
    const f = fighter(g, 0);
    f.x = px(2000);
    stepGame(g, [0, 0]);
    expect(f.stocks).toBe(0);
    for (let i = 0; i < 300; i++) stepGame(g, [0, 0]);
    expect(f.state).toBe('ko');
    expect(canBeHit(f)).toBe(false);
  });

  it('andar para fora do mapa e cair é KO (sem recuperar)', () => {
    const g = createGame();
    let kos = 0;
    for (let i = 0; i < 400 && kos === 0; i++) {
      stepGame(g, [Button.LEFT | Button.DOWN, 0]);
      if (fighter(g, 0).state === 'ko') kos++;
    }
    expect(kos).toBe(1);
  });

  it('aéreo lado em quem está com muito % na borda manda para fora', () => {
    const g = createGame();
    const [a, b] = [fighter(g, 0), fighter(g, 1)];
    for (let i = 0; i < 3; i++) stepGame(g, [0, 0]);
    // P1 no ar perto da borda direita, P2 colado na frente dele
    a.x = px(330);
    a.y = px(-150);
    a.grounded = false;
    a.facing = 1;
    b.x = a.x + px(60);
    b.y = a.y;
    b.damage = 120;
    stepGame(g, [Button.RIGHT | Button.ATTACK, 0]);
    expect(a.move).toBe('sideAir');
    let ko = false;
    for (let i = 0; i < 240 && !ko; i++) {
      stepGame(g, [0, 0]);
      ko = b.state === 'ko';
    }
    expect(ko).toBe(true);
    expect(b.stocks).toBe(DEFAULT_RULES.stocks - 1);
  });

  it('é determinístico: mesmos inputs, mesmo estado', () => {
    const inputs: [number, number][] = [];
    let seed = 12345;
    for (let i = 0; i < 2000; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      inputs.push([seed & 0xff, (seed >> 8) & 0xff]);
    }
    const a = createGame();
    const b = createGame();
    for (const inp of inputs) stepGame(a, inp);
    for (const inp of inputs) stepGame(b, inp);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    // tudo inteiro: nada de fração no estado
    for (const f of a.fighters) {
      for (const v of [f.x, f.y, f.vx, f.vy, f.kbx, f.kby, f.damage]) {
        expect(Number.isInteger(v)).toBe(true);
      }
    }
  });

  it('cloneState gera cópia independente', () => {
    const g = createGame();
    const snap = cloneState(g);
    stepGame(g, [Button.RIGHT, 0]);
    expect(snap.tick).toBe(0);
    expect(snap.fighters[0]?.x).not.toBe(g.fighters[0]?.x);
  });
});

/** Tira o lutador da blast zone (KO no próximo tick). */
function throwOut(f: Fighter): void {
  f.x = px(5000);
}

describe('fim da partida', () => {
  it('perder o último stock acaba a luta; o outro vence', () => {
    const g = createGame({ rules: { stocks: 1, timeLimitTicks: 0 } });
    throwOut(fighter(g, 0));
    stepGame(g, [0, 0]);
    expect(g.phase).toBe('over');
    expect(g.winner).toBe(1);
  });

  it('com a luta acabada, nada mais se mexe', () => {
    const g = createGame({ rules: { stocks: 1, timeLimitTicks: 0 } });
    throwOut(fighter(g, 1));
    stepGame(g, [0, 0]);
    const snap = JSON.stringify(g.fighters);
    for (let i = 0; i < 30; i++) stepGame(g, [Button.RIGHT | Button.JUMP, Button.ATTACK]);
    expect(JSON.stringify(g.fighters)).toBe(snap);
    expect(g.tick).toBe(31);
  });

  it('os dois perdem o último stock no mesmo tick: empate', () => {
    const g = createGame({ rules: { stocks: 1, timeLimitTicks: 0 } });
    throwOut(fighter(g, 0));
    throwOut(fighter(g, 1));
    stepGame(g, [0, 0]);
    expect(g.phase).toBe('over');
    expect(g.winner).toBeNull();
  });

  it('o relógio desconta 1 por tick', () => {
    const g = createGame();
    expect(g.timeLeft).toBe(DEFAULT_RULES.timeLimitTicks);
    for (let i = 0; i < 10; i++) stepGame(g, [0, 0]);
    expect(g.timeLeft).toBe(DEFAULT_RULES.timeLimitTicks - 10);
  });

  it('fim do tempo: vence quem tem mais stocks', () => {
    const g = createGame({ rules: { stocks: 3, timeLimitTicks: 5 } });
    fighter(g, 0).stocks = 2;
    fighter(g, 1).damage = 150;
    for (let i = 0; i < 5; i++) stepGame(g, [0, 0]);
    expect(g.phase).toBe('over');
    expect(g.winner).toBe(1);
  });

  it('fim do tempo com stocks iguais: vence quem tem menos %', () => {
    const g = createGame({ rules: { stocks: 3, timeLimitTicks: 5 } });
    fighter(g, 0).damage = 40;
    fighter(g, 1).damage = 41;
    for (let i = 0; i < 5; i++) stepGame(g, [0, 0]);
    expect(g.winner).toBe(0);
  });

  it('empate total: morte súbita com 1 stock e 300%, e o próximo KO decide', () => {
    const g = createGame({ rules: { stocks: 3, timeLimitTicks: 5 } });
    for (let i = 0; i < 5; i++) stepGame(g, [0, 0]);
    expect(g.phase).toBe('fight');
    expect(g.suddenDeath).toBe(true);
    for (const f of g.fighters) {
      expect(f.stocks).toBe(1);
      expect(f.damage).toBe(SUDDEN_DEATH_DAMAGE);
    }
    for (let i = 0; i < 100; i++) stepGame(g, [0, 0]);
    expect(g.phase).toBe('fight'); // sem limite de tempo na morte súbita
    throwOut(fighter(g, 1));
    stepGame(g, [0, 0]);
    expect(g.phase).toBe('over');
    expect(g.winner).toBe(0);
  });

  it('contagem: ninguém age e o relógio para até a luta começar', () => {
    const g = createGame({ rules: MATCH_RULES });
    expect(g.phase).toBe('countdown');
    expect(g.countdown).toBe(COUNTDOWN_TICKS);
    const start = fighter(g, 0).x;
    for (let i = 0; i < COUNTDOWN_TICKS - 1; i++) stepGame(g, [Button.RIGHT | Button.ATTACK, 0]);
    expect(g.phase).toBe('countdown');
    expect(fighter(g, 0).x).toBe(start);
    expect(fighter(g, 0).state).toBe('idle');
    expect(g.timeLeft).toBe(MATCH_RULES.timeLimitTicks);
    stepGame(g, [Button.RIGHT, 0]);
    expect(g.phase).toBe('fight');
    expect(g.countdown).toBe(0);
    stepGame(g, [Button.RIGHT, 0]);
    expect(fighter(g, 0).x).toBeGreaterThan(start);
    expect(g.timeLeft).toBe(MATCH_RULES.timeLimitTicks - 1);
  });

  it('sem contagem nas regras, a luta começa direto', () => {
    expect(createGame().phase).toBe('fight');
  });

  it('com 4, cada um começa num lugar diferente, sem encostar, e pousa no mapa', () => {
    for (const stage of STAGES) {
      const g = createGame({ characters: ['base', 'base', 'base', 'base'], stage });
      for (let i = 0; i < 90; i++) stepGame(g, [0, 0, 0, 0]);
      for (const f of g.fighters) {
        expect(f.grounded).toBe(true);
        for (const o of g.fighters) {
          if (o === f) continue;
          const apart =
            f.x + f.w <= o.x || o.x + o.w <= f.x || f.y + f.h <= o.y || o.y + o.h <= f.y;
          expect(apart).toBe(true);
        }
      }
      // os respawns ficam acima do mapa e longe da blast zone
      const b = stage.blastZone;
      for (const r of stage.respawns.slice(0, 4)) {
        expect(r.x).toBeGreaterThan(b.x + px(300));
        expect(r.x).toBeLessThan(b.x + b.w - px(300));
        expect(r.y).toBeGreaterThan(b.y + px(300));
        expect(r.y).toBeLessThan(0);
      }
    }
  });

  it('todo mapa tem spawn e respawn para 4 jogadores', () => {
    for (const stage of STAGES) {
      expect(stage.spawns.length).toBeGreaterThanOrEqual(4);
      expect(stage.respawns.length).toBeGreaterThanOrEqual(4);
      expect(getStage(stage.id)).toBe(stage);
    }
  });
});
