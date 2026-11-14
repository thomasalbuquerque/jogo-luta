import { stepGame, type GameState } from '@jogo-luta/sim';
import { describe, expect, it } from 'vitest';
import { createTutorialGame, DEMO_MAX_TICKS, DONE_TICKS, TutorialDirector } from './director';
import { LESSONS } from './lessons';

function tick(state: GameState, director: TutorialDirector, player = 0): void {
  stepGame(state, director.inputs(state, player));
  director.afterStep(state);
}

/** Roda até sair da fase atual (ou estourar o limite). */
function runPhase(state: GameState, director: TutorialDirector, limit: number): void {
  const phase = director.phase;
  const index = director.index;
  for (let i = 0; i < limit && director.phase === phase && director.index === index; i++) {
    tick(state, director);
  }
}

describe('tutorial', () => {
  it.each(LESSONS.map((l, i) => [l.id, i] as const))(
    'a demonstração de "%s" consegue fazer o que a lição pede',
    (_id, i) => {
      const state = createTutorialGame();
      const director = new TutorialDirector();
      director.start(state, i);
      for (let t = 0; t < DEMO_MAX_TICKS && !director.demoSucceeded; t++) tick(state, director);
      expect(director.demoSucceeded).toBe(true);
    },
  );

  it.each(LESSONS.map((l, i) => [l.id, i] as const))(
    'jogando como na demonstração, a vez do jogador em "%s" passa',
    (_id, i) => {
      const state = createTutorialGame();
      const director = new TutorialDirector();
      director.autoplay = true;
      director.start(state, i);
      runPhase(state, director, DEMO_MAX_TICKS + 1);
      expect(director.phase).toBe('try');
      runPhase(state, director, DEMO_MAX_TICKS);
      expect(director.phase).toBe('done');
    },
  );

  it('sem o jogador fazer nada, fica na vez dele', () => {
    const state = createTutorialGame();
    const director = new TutorialDirector();
    director.start(state, 0);
    runPhase(state, director, DEMO_MAX_TICKS + 1);
    for (let t = 0; t < 600; t++) tick(state, director);
    expect(director.phase).toBe('try');
    expect(director.index).toBe(0);
  });

  it('passa por todas as lições e termina em treino livre', () => {
    const state = createTutorialGame();
    const director = new TutorialDirector();
    director.autoplay = true;
    director.start(state, 0);
    const limit = LESSONS.length * (2 * DEMO_MAX_TICKS + DONE_TICKS + 10);
    for (let t = 0; t < limit && director.phase !== 'finished'; t++) tick(state, director);
    expect(director.phase).toBe('finished');
    // treino livre: o input do jogador vai direto para o Crocko
    expect(director.inputs(state, 5)[0]).toBe(5);
  });

  it('pular e ver de novo voltam para a demonstração', () => {
    const state = createTutorialGame();
    const director = new TutorialDirector();
    director.start(state, 0);
    director.skip(state);
    expect(director.index).toBe(1);
    expect(director.phase).toBe('demo');
    for (let t = 0; t < 20; t++) tick(state, director);
    director.replayDemo(state);
    expect(director.index).toBe(1);
    expect(director.t).toBe(0);
  });
});
