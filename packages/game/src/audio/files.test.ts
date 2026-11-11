import { describe, expect, it } from 'vitest';
import { audioKey, groupAudioFiles } from './files';

describe('áudios gravados', () => {
  it('a chave é o caminho dentro de audio/, sem extensão', () => {
    expect(audioKey('../../../../audio/vozes/schummaki_bordao.opus')).toBe(
      'vozes/schummaki_bordao',
    );
    expect(audioKey('../../../../audio/musica/luta.mp3')).toBe('musica/luta');
    expect(audioKey('../../../../audio/LEIAME.md')).toBeNull();
  });

  it('junta o mesmo áudio em formatos diferentes', () => {
    const files = groupAudioFiles({
      '../../../../audio/musica/luta.ogg': '/a.ogg',
      '../../../../audio/musica/luta.mp3': '/a.mp3',
      '../../../../audio/vozes/x_ko.opus': '/b.opus',
    });
    expect(files.get('musica/luta')).toEqual(['/a.mp3', '/a.ogg']);
    expect(files.get('vozes/x_ko')).toEqual(['/b.opus']);
  });
});
