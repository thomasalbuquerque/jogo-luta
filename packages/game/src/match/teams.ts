import { MATCH_RULES, type MatchRules } from '@jogo-luta/sim';

/**
 * Times da luta, como os menus montam: o time de cada jogador (null = todos
 * contra todos) e se o fogo amigo está ligado. Só faz sentido com 3 ou 4
 * jogadores; com 2, é sempre todos contra todos.
 */
export interface TeamSetup {
  teams: number[] | null;
  friendlyFire: boolean;
}

export const FREE_FOR_ALL: TeamSetup = { teams: null, friendlyFire: false };

/** Nome de cada time (o time 0 é o do P1). */
export const TEAM_NAMES = ['VERMELHO', 'AZUL'] as const;

/** Jogadores mínimos para ter times (2 contra 1 ou 2 contra 2). */
export const MIN_TEAM_PLAYERS = 3;

/**
 * Jeitos de dividir `players` jogadores em 2 times, com o P1 sempre no time 0
 * (assim cada divisão aparece uma vez só). Com 4: os 3 jeitos de 2 contra 2;
 * com 3: os 3 jeitos de 2 contra 1. Com menos de 3 ou mais de 4: nenhum.
 */
export function teamSplits(players: number): number[][] {
  if (players === 4) {
    return [
      [0, 0, 1, 1],
      [0, 1, 0, 1],
      [0, 1, 1, 0],
    ];
  }
  if (players === 3) {
    return [
      [0, 0, 1],
      [0, 1, 0],
      [0, 1, 1],
    ];
  }
  return [];
}

/** Índice de `teams` em `teamSplits` (-1 = não é uma das divisões). */
export function splitIndex(teams: readonly number[]): number {
  const key = teams.join(',');
  return teamSplits(teams.length).findIndex((split) => split.join(',') === key);
}

/**
 * Times que ainda servem para `players` jogadores: os mesmos, se o número bate
 * e são uma das divisões válidas; senão, todos contra todos.
 */
export function fitTeams(setup: TeamSetup, players: number): TeamSetup {
  const teams = setup.teams;
  if (!teams || teams.length !== players || splitIndex(teams) < 0) return FREE_FOR_ALL;
  return { teams: [...teams], friendlyFire: setup.friendlyFire };
}

/**
 * Times de quem ficou na sala: tira os lugares de quem saiu (`keep` = os
 * lugares antigos que continuam, na ordem nova). Se não sobrar uma divisão
 * válida, vira todos contra todos.
 */
export function keepTeams(setup: TeamSetup, keep: readonly number[]): TeamSetup {
  if (!setup.teams) return FREE_FOR_ALL;
  const teams = keep.map((seat) => setup.teams?.[seat] ?? 0);
  // o P1 de agora pode ter sido do time 1: troca os nomes para ele ficar no 0
  const flip = teams[0] === 1;
  return fitTeams(
    { teams: teams.map((t) => (flip ? 1 - t : t)), friendlyFire: setup.friendlyFire },
    teams.length,
  );
}

/** Regras da luta com os times escolhidos (o fogo amigo só vale com times). */
export function rulesFor(setup: TeamSetup): MatchRules {
  return { ...MATCH_RULES, friendlyFire: setup.teams !== null && setup.friendlyFire };
}

/** Os lutadores estão divididos em times (algum time tem mais de um)? */
export function hasTeams(fighters: readonly { team: number }[]): boolean {
  return new Set(fighters.map((f) => f.team)).size < fighters.length;
}

/** "P1 + P3" (os jogadores do time `team`, em ordem). */
export function teamMembers(teams: readonly number[], team: number): string {
  return teams.flatMap((t, p) => (t === team ? [`P${String(p + 1)}`] : [])).join(' + ');
}

/** "TIME VERMELHO" */
export function teamName(team: number): string {
  return `TIME ${TEAM_NAMES[team] ?? String(team + 1)}`;
}
