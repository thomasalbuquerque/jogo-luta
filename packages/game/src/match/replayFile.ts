import { decodeReplay, encodeReplay, getCharacter, type Replay } from '@jogo-luta/sim';

/** Arquivo de replay maior que isso nem é lido (um replay de 30 min não chega perto). */
const MAX_FILE_BYTES = 2 * 1024 * 1024;

/**
 * Seed de uma luta nova. É o único sorteio "de verdade" da luta: fica fora do
 * `sim` e vai gravada no replay.
 */
export function newSeed(): number {
  return Math.floor(Math.random() * 0x100000000);
}

function two(n: number): string {
  return String(n).padStart(2, '0');
}

/** Nome do arquivo: quem lutou e quando (`replay-schummaki-x-joao-frango-2026-11-11-2130.json`). */
export function replayFileName(replay: Pick<Replay, 'characters'>, when: Date): string {
  const who = replay.characters.join('-x-');
  const day = `${String(when.getFullYear())}-${two(when.getMonth() + 1)}-${two(when.getDate())}`;
  const time = `${two(when.getHours())}${two(when.getMinutes())}`;
  return `replay-${who}-${day}-${time}.json`;
}

/** "Schummaki x João Frango": quem lutou, para mostrar na tela. */
export function replayTitle(replay: Pick<Replay, 'characters'>): string {
  return replay.characters.map((id) => getCharacter(id).name).join(' x ');
}

/** Baixa o replay como arquivo (vai para a pasta de downloads). Devolve o nome do arquivo. */
export function saveReplayFile(replay: Replay): string {
  const name = replayFileName(replay, new Date());
  const url = URL.createObjectURL(new Blob([encodeReplay(replay)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // o download começa no clique; soltar a URL logo depois não o cancela
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
  return name;
}

/** Lê e confere um arquivo de replay. Arquivo estranho: erro com mensagem legível. */
export async function readReplayFile(file: File): Promise<Replay> {
  if (file.size > MAX_FILE_BYTES) throw new Error('Replay inválido: arquivo grande demais.');
  return decodeReplay(await file.text());
}

/**
 * Abre a janela de escolher arquivo e chama `onFile` com o escolhido. O
 * navegador só abre a janela logo depois de uma tecla ou clique: pelo controle
 * pode não abrir (aí vale arrastar o arquivo para o jogo).
 */
export function pickReplayFile(onFile: (file: File) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) onFile(file);
  });
  input.click();
}
