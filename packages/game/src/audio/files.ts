/**
 * Áudios gravados que entram no jogo: tudo o que estiver na pasta `audio/` da
 * raiz (ver `audio/LEIAME.md`). A chave é o caminho sem a extensão, como
 * `vozes/schummaki_bordao`, `musica/luta` ou `sfx/hit_heavy`. Um áudio gravado
 * substitui o gerado em código com a mesma chave.
 */

/** Formatos aceitos (o navegador escolhe o primeiro que tocar). */
export const AUDIO_EXTENSIONS = ['ogg', 'opus', 'mp3', 'm4a', 'wav', 'webm'] as const;

/** Chave de um arquivo achado pelo glob (`.../audio/vozes/x.opus` → `vozes/x`). */
export function audioKey(path: string): string | null {
  const match = /(?:^|\/)audio\/(.+)\.([a-z0-9]+)$/i.exec(path);
  if (!match?.[1] || !match[2]) return null;
  const ext = match[2].toLowerCase();
  if (!(AUDIO_EXTENSIONS as readonly string[]).includes(ext)) return null;
  return match[1];
}

/** Junta as URLs por chave (o mesmo áudio pode vir em mais de um formato). */
export function groupAudioFiles(urls: Readonly<Record<string, string>>): Map<string, string[]> {
  const byKey = new Map<string, string[]>();
  for (const path of Object.keys(urls).sort()) {
    const key = audioKey(path);
    const url = urls[path];
    if (!key || !url) continue;
    byKey.set(key, [...(byKey.get(key) ?? []), url]);
  }
  return byKey;
}

const found = import.meta.glob<string>('../../../../audio/**/*.{ogg,opus,mp3,m4a,wav,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** Áudios gravados disponíveis neste build, por chave. */
export const AUDIO_FILES: ReadonlyMap<string, readonly string[]> = groupAudioFiles(found);
