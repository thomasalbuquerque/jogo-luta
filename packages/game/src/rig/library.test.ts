import { describe, expect, it } from 'vitest';
import {
  ANIMATION_KEYS,
  BASE_MOVE_IDS,
  getCharacter,
  PLAYABLE_CHARACTERS,
  type Character,
} from '@jogo-luta/sim';
import { movePhaseTime, sampleClip } from './animation';
import { BASE_CLIPS } from './clips';
import { CHARACTER_CLIPS } from './characterClips';
import { clipFor, moveForClip } from './library';

const characters: Character[] = PLAYABLE_CHARACTERS.map((id) => getCharacter(id));
const moveKeys = [...BASE_MOVE_IDS, 'special'] as const;

describe('biblioteca de animações', () => {
  it('todo estado do lutador tem um clipe no esqueleto base', () => {
    for (const key of ANIMATION_KEYS) {
      if (key === 'ko' || key === 'special') continue;
      expect(BASE_CLIPS[key], key).toBeDefined();
    }
  });

  it('cada personagem jogável tem especial e provocação próprios', () => {
    for (const c of characters) {
      expect(CHARACTER_CLIPS[`${c.id.replaceAll('-', '_')}_special`], c.id).toBeDefined();
      expect(CHARACTER_CLIPS[c.taunt.animation], c.id).toBeDefined();
    }
  });

  it('o quadro de impacto (t = 1) aparece no 1º frame ativo de cada golpe', () => {
    for (const c of characters) {
      for (const key of moveKeys) {
        const move = moveForClip(c, key);
        if (!move) continue;
        const clip = clipFor(c, key);
        expect(clip.timing, `${c.id} ${key}`).toBe('move');
        expect(
          clip.keys.some((k) => k.t === 1),
          `${c.id} ${key}: falta a chave de impacto`,
        ).toBe(true);
        const t = movePhaseTime(move.startup + 1, move.startup, move.active, move.recovery);
        expect(sampleClip(clip, t), `${c.id} ${key}`).toEqual(sampleClip(clip, 1));
        // antes do 1º frame ativo, ainda não é o impacto
        if (move.startup > 0) {
          const before = movePhaseTime(move.startup, move.startup, move.active, move.recovery);
          expect(before, `${c.id} ${key}`).toBeLessThan(1);
        }
      }
    }
  });
});
