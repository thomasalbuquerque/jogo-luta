import { createGame, MATCH_RULES, stepGame, NO_INPUT, Button } from '@jogo-luta/sim';
import { describe, expect, it } from 'vitest';
import { parseBotLevel } from '../profile/botLevel';
import { botName, BotPlayers, hasBots, humanInputs, parseBots, seatNames } from './bots';

describe('bots na luta local', () => {
  it('sabe se tem bot e lê os lugares vindos de fora', () => {
    expect(hasBots([null, 'hard'])).toBe(true);
    expect(hasBots([null, null])).toBe(false);
    expect(hasBots(null)).toBe(false);
    expect(parseBots([null, 'easy'])).toEqual([null, 'easy']);
    expect(parseBots([null, 'perfeito'])).toBeNull();
    expect(parseBots('hard')).toBeNull();
  });

  it('o bot aparece como "CPU" e o nível; as pessoas com o nome delas', () => {
    expect(botName('medium')).toBe('CPU Médio');
    expect(seatNames([null, 'hard'], ['Thomas'])).toEqual(['Thomas', 'CPU Difícil']);
    expect(seatNames(['easy', null], [null])).toEqual(['CPU Fácil', null]);
  });

  it('com uma pessoa só, qualquer teclado ou controle mexe nela', () => {
    const sampled = [Button.LEFT, Button.ATTACK];
    expect(humanInputs(sampled, [null, 'medium'])).toEqual([Button.LEFT | Button.ATTACK, NO_INPUT]);
    expect(humanInputs(sampled, ['medium', null])).toEqual([NO_INPUT, Button.LEFT | Button.ATTACK]);
    // duas pessoas e um bot: cada pessoa com os próprios controles
    expect(humanInputs([1, 2, 4], [null, 'easy', null])).toEqual([1, NO_INPUT, 2]);
  });

  it('troca só o input dos lugares de bot', () => {
    const state = createGame({ characters: ['schummaki', 'tchula'], rules: MATCH_RULES });
    const bots = new BotPlayers([null, 'hard'], 7);
    for (let t = 0; t < 400; t++) {
      const inputs = bots.apply(state, [Button.RIGHT, NO_INPUT]);
      expect(inputs[0]).toBe(Button.RIGHT);
      stepGame(state, inputs);
    }
    expect(bots.doing(0)).toBeNull();
    expect(bots.doing(1)).not.toBe('');
  });

  it('nível salvo inválido vira o médio', () => {
    expect(parseBotLevel('hard')).toBe('hard');
    expect(parseBotLevel('impossível')).toBe('medium');
    expect(parseBotLevel(null)).toBe('medium');
  });
});
