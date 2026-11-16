import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanName, letters, MAX_NAME_LENGTH, parseSavedName, playerTag } from './playerName';

describe('cleanName', () => {
  it('tira os espaços das pontas e junta os do meio', () => {
    expect(cleanName('  Thomas   Albuquerque ')).toBe('Thomas Albuq');
    expect(cleanName(' Ana  Paula ')).toBe('Ana Paula');
  });

  it('corta no máximo de letras, contando acento e emoji como uma', () => {
    expect(letters(cleanName('João🔥'.repeat(5)))).toHaveLength(MAX_NAME_LENGTH);
    expect(cleanName('👍🏽'.repeat(20))).toBe('👍🏽'.repeat(MAX_NAME_LENGTH));
    expect(cleanName('João')).toBe('João');
  });

  it('troca quebra de linha e caracteres de controle por espaço', () => {
    expect(cleanName('Zé\n\tRuela\u0000')).toBe('Zé Ruela');
  });

  it('não deixa espaço no fim depois de cortar', () => {
    expect(cleanName('Maximiliano Silva')).toBe('Maximiliano');
  });
});

describe('parseSavedName', () => {
  it('nome salvo volta limpo', () => {
    expect(parseSavedName(' Bia ')).toBe('Bia');
  });

  it('nada salvo, ou só espaço: sem nome', () => {
    expect(parseSavedName(null)).toBeNull();
    expect(parseSavedName('   ')).toBeNull();
  });
});

describe('playerTag', () => {
  it('mostra o nome; sem nome, o número do jogador', () => {
    expect(playerTag(0, 'Thomas')).toBe('Thomas');
    expect(playerTag(1, null)).toBe('P2');
    expect(playerTag(2, '')).toBe('P3');
    expect(playerTag(3, undefined)).toBe('P4');
  });
});

describe('getPlayerName / setPlayerName', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  function fakeStorage(initial: Record<string, string> = {}) {
    const data = new Map(Object.entries(initial));
    return {
      data,
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    };
  }

  it('lê o nome salvo e salva o novo', async () => {
    const storage = fakeStorage({ 'jogo-luta:nome': 'Thomas' });
    vi.stubGlobal('localStorage', storage);
    const m = await import('./playerName');
    expect(m.getPlayerName()).toBe('Thomas');
    expect(m.setPlayerName('  Bia  ')).toBe('Bia');
    expect(m.getPlayerName()).toBe('Bia');
    expect(storage.data.get(m.NAME_STORAGE_KEY)).toBe('Bia');
  });

  it('nome vazio não troca nada', async () => {
    vi.stubGlobal('localStorage', fakeStorage({ 'jogo-luta:nome': 'Thomas' }));
    const m = await import('./playerName');
    expect(m.setPlayerName('   ')).toBeNull();
    expect(m.getPlayerName()).toBe('Thomas');
  });

  it('sem localStorage: começa sem nome e lembra até fechar a aba', async () => {
    vi.stubGlobal('localStorage', undefined);
    const m = await import('./playerName');
    expect(m.getPlayerName()).toBeNull();
    expect(m.setPlayerName('Zé')).toBe('Zé');
    expect(m.getPlayerName()).toBe('Zé');
  });
});
