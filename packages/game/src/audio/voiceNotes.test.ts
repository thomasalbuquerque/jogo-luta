import { describe, expect, it } from 'vitest';
import { voiceNotes } from './voiceNotes';

describe('voz provisória', () => {
  it('uma nota por sílaba, sempre igual para o mesmo texto', () => {
    const notes = voiceNotes('Vem com o Schummy, mermão!');
    expect(notes.length).toBeGreaterThanOrEqual(5);
    expect(voiceNotes('Vem com o Schummy, mermão!')).toEqual(notes);
  });

  it('vogal esticada vira nota longa', () => {
    const notes = voiceNotes('Ô Mariiiliaaa!');
    const longest = Math.max(...notes.map((n) => n.dur));
    expect(longest).toBeGreaterThan(0.15);
  });

  it('texto sem vogal não toca nada', () => {
    expect(voiceNotes('...')).toEqual([]);
  });
});
