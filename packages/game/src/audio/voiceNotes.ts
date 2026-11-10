/** Uma nota da voz provisória: frequência (Hz) e duração (s). */
export interface VoiceNote {
  freq: number;
  dur: number;
}

const SYLLABLE = /[^aeiouáéíóúâêôãõà]*[aeiouáéíóúâêôãõà]+/gi;

/**
 * Voz provisória da provocação, enquanto não há o áudio gravado pelo amigo
 * (Etapa 5): cada sílaba do bordão vira uma nota; vogal esticada ("Mariiiliaaa")
 * vira nota longa. Sempre o mesmo resultado para o mesmo texto.
 */
export function voiceNotes(text: string): VoiceNote[] {
  const syllables = text.match(SYLLABLE) ?? [];
  let hash = 7;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  const base = 170 + (hash % 120);
  return syllables.map((s, i) => {
    const vowels = s.match(/[aeiouáéíóúâêôãõà]/gi)?.length ?? 1;
    const rise = i === syllables.length - 1 && text.includes('!') ? 1.25 : 1;
    const wobble = 1 + (((hash + i * 37) % 9) - 4) / 30;
    return {
      freq: Math.round(base * wobble * rise),
      dur: Math.min(0.07 + 0.05 * (vowels - 1), 0.35),
    };
  });
}
