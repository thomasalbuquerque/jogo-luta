import type { ButtonName } from '@jogo-luta/sim';
import { PAD_ACTIONS, PAD_SELECT, PAD_START, type PadAction } from '../input/bindings';
import { keyLabel, padButtonLabel, type Controls } from '../input/controls';

/** Com o que a pessoa vai jogar o tutorial: os textos mostram os botões dele. */
export type TutorialDevice = 'keyboard' | 'pad';

const NAMES: Readonly<Record<ButtonName, string>> = {
  LEFT: 'Esquerda',
  RIGHT: 'Direita',
  UP: 'Cima',
  DOWN: 'Baixo',
  JUMP: 'Pular',
  ATTACK: 'Ataque',
  SPECIAL: 'Especial',
  DODGE: 'Esquiva',
  TAUNT: 'Provocação',
};

/** No controle, as direções são sempre o analógico esquerdo e o D-pad. */
const ARROWS: Partial<Readonly<Record<ButtonName, string>>> = {
  LEFT: '←',
  RIGHT: '→',
  UP: '↑',
  DOWN: '↓',
};

function isPadAction(name: ButtonName): name is PadAction {
  return (PAD_ACTIONS as readonly string[]).includes(name);
}

function keysOf(controls: Controls, player: number, name: ButtonName): string {
  return (controls.keys[player]?.[name] ?? []).map(keyLabel).join(' / ');
}

/** O botão como aparece no texto: a tecla do jogador 1, ou o botão do controle. */
export function buttonPrompt(controls: Controls, device: TutorialDevice, name: ButtonName): string {
  if (device === 'keyboard') return `[${keysOf(controls, 0, name)}]`;
  if (isPadAction(name)) return `[${controls.pad[name].map(padButtonLabel).join(' / ')}]`;
  return `[${ARROWS[name] ?? NAMES[name]}]`;
}

/** Troca cada `{BOTÃO}` do texto da lição (ex.: `{ATTACK}`) pelo botão do aparelho escolhido. */
export function formatPrompt(text: string, controls: Controls, device: TutorialDevice): string {
  return text.replace(/\{([A-Z]+)\}/g, (token, name: string) =>
    name in NAMES ? buttonPrompt(controls, device, name as ButtonName) : token,
  );
}

/** Legenda embaixo do texto: o que é cada botão usado na lição. */
export function buttonHint(controls: Controls, device: TutorialDevice, name: ButtonName): string {
  if (device === 'pad') {
    const where = isPadAction(name)
      ? controls.pad[name].map(padButtonLabel).join(' / ')
      : `${ARROWS[name] ?? ''} no analógico ou no D-pad`;
    return `${NAMES[name]}: ${where}`;
  }
  return `${NAMES[name]}: ${keysOf(controls, 0, name)}  (jogador 2: ${keysOf(controls, 1, name)})`;
}

/**
 * Botão de ver a demonstração de novo: Tab no teclado, Select no controle. Os dois
 * são reservados (nenhum botão do jogo usa); no tutorial, a pausa do controle é o Start.
 */
export function replayButton(device: TutorialDevice): string {
  return device === 'pad' ? padButtonLabel(PAD_SELECT) : 'Tab';
}

/** Como rever a demonstração e abrir a pausa, no aparelho escolhido. */
export function footerPrompt(device: TutorialDevice): string {
  const pause = device === 'pad' ? padButtonLabel(PAD_START) : 'Esc';
  return `${replayButton(device)}: ver de novo · ${pause}: pausa (pular lição ou sair)`;
}

export function finishedPrompt(device: TutorialDevice): string {
  const pause = device === 'pad' ? 'Start' : 'Esc';
  return `Agora é treino livre com o boneco. Os outros personagens você descobre jogando: cada um tem o seu especial. ${pause} abre a pausa para voltar ao menu.`;
}
