import Phaser from 'phaser';
import type { ButtonName } from '@jogo-luta/sim';
import { playSfx } from '../audio/sfx';
import { PAD_ACTIONS, type PadAction } from '../input/bindings';
import { getControls, type Controls } from '../input/controls';
import { VIEW } from '../render/view';
import type { TutorialPhase } from '../tutorial/director';
import type { Lesson } from '../tutorial/lessons';
import { BUTTON_LABELS, keysText, padText } from '../ui/controlsCard';
import { panel, UI, uiText } from '../ui/theme';
import type { FightScene } from './FightScene';

const PANEL_W = 1080;
const PANEL_X = (VIEW.width - PANEL_W) / 2;
const PANEL_Y = 14;

const PHASE_LOOK: Record<TutorialPhase, { label: string; color: number }> = {
  demo: { label: '▶  VEJA COMO FAZ', color: 0x4cc9f0 },
  try: { label: 'SUA VEZ!', color: 0xffd166 },
  done: { label: '✓  BOA!', color: 0x80ed99 },
  finished: { label: '✓  TUTORIAL CONCLUÍDO', color: 0x80ed99 },
};

/** Tecla de ver a demonstração de novo (Tab é reservada: nenhum botão do jogo usa). */
const REPLAY_KEY = 'TAB';
const REPLAY_KEY_LABEL = 'Tab';
const REPLAY_BG = '#4cc9f0';
const REPLAY_BG_HOVER = '#8ddcf6';

function isPadAction(name: ButtonName): name is PadAction {
  return (PAD_ACTIONS as readonly string[]).includes(name);
}

/** Teclas de um botão: P1, P2 e o controle. */
export function buttonHint(controls: Controls, name: ButtonName): string {
  const keys = controls.keys.map((k) => keysText(k[name])).join(' ou ');
  const pad = isPadAction(name) ? padText(controls.pad[name]) : 'analógico / D-pad';
  return `${BUTTON_LABELS[name]}: ${keys} · controle ${pad}`;
}

/**
 * Painel do tutorial por cima da luta (no lugar do HUD): a lição, o que fazer,
 * as teclas de cada botão e em que fase está (demonstração, sua vez, boa!).
 */
export class TutorialScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private progress!: Phaser.GameObjects.Text;
  private title!: Phaser.GameObjects.Text;
  private body!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private badge!: Phaser.GameObjects.Text;
  /** "Ver de novo": repete a demonstração da lição (clique ou Tab), na vez do jogador. */
  private replay!: Phaser.GameObjects.Text;
  private shown = '';
  private shownPhase: TutorialPhase | null = null;

  constructor() {
    super('tutorial');
  }

  create(): void {
    this.shown = '';
    this.shownPhase = null;
    this.gfx = this.add.graphics();
    this.progress = uiText(this, PANEL_X + 22, PANEL_Y + 14, '', {
      fontSize: '15px',
      fontStyle: 'bold',
      color: UI.muted,
    });
    this.title = uiText(this, PANEL_X + 22, PANEL_Y + 34, '', {
      fontFamily: UI.titleFont,
      fontSize: '28px',
      color: '#ffd166',
    });
    this.body = uiText(this, PANEL_X + 22, PANEL_Y + 76, '', {
      fontSize: '20px',
      lineSpacing: 4,
      wordWrap: { width: PANEL_W - 44 },
    });
    this.hint = uiText(this, PANEL_X + 22, 0, '', {
      fontSize: '15px',
      color: UI.muted,
      lineSpacing: 3,
      wordWrap: { width: PANEL_W - 44 },
    });
    this.badge = uiText(this, PANEL_X + PANEL_W - 22, PANEL_Y + 18, '', {
      fontFamily: UI.titleFont,
      fontSize: '20px',
      color: '#0b0e16',
      padding: { x: 12, y: 6 },
    }).setOrigin(1, 0);
    this.replay = uiText(this, PANEL_X + PANEL_W, 0, `↺  Ver de novo (${REPLAY_KEY_LABEL})`, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#0b0e16',
      backgroundColor: REPLAY_BG,
      padding: { x: 14, y: 8 },
    })
      .setOrigin(1, 0)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.replay.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.replay.setBackgroundColor(REPLAY_BG_HOVER);
    });
    this.replay.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.replay.setBackgroundColor(REPLAY_BG);
    });
    this.replay.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.replayDemo();
    });
    // Tab é reservada (nenhum botão do jogo usa); sem o capture, o navegador troca o foco
    this.input.keyboard?.addCapture(REPLAY_KEY);
    this.input.keyboard?.on(`keydown-${REPLAY_KEY}`, (e: KeyboardEvent) => {
      if (!e.repeat) this.replayDemo();
    });
    uiText(
      this,
      VIEW.width / 2,
      VIEW.height - 22,
      `${REPLAY_KEY_LABEL}: ver de novo · Esc: pausa (pular lição ou sair)`,
      {
        fontSize: '16px',
        color: UI.muted,
        stroke: '#0b0e16',
        strokeThickness: 4,
      },
    ).setOrigin(0.5);
  }

  override update(): void {
    const tutorial = this.fight.tutorial;
    if (!tutorial) return;
    const lesson = tutorial.lesson;
    const key = String(tutorial.index);
    if (key !== this.shown) {
      this.shown = key;
      this.showLesson(lesson, tutorial.index, tutorial.lessons.length);
    }
    if (tutorial.phase !== this.shownPhase) {
      if (tutorial.phase === 'done') playSfx(this, 'ui_confirm');
      this.shownPhase = tutorial.phase;
      const look = PHASE_LOOK[tutorial.phase];
      this.badge.setText(look.label);
      this.badge.setBackgroundColor(`#${look.color.toString(16).padStart(6, '0')}`);
      if (tutorial.phase === 'try' || tutorial.phase === 'done') {
        this.tweens.add({ targets: this.badge, scale: { from: 1.25, to: 1 }, duration: 220 });
      }
      this.replay.setVisible(tutorial.phase === 'try');
      this.replay.setBackgroundColor(REPLAY_BG);
    }
  }

  /** Mostra de novo a demonstração da lição atual (só na vez do jogador, fora da pausa). */
  private replayDemo(): void {
    const fight = this.fight;
    const tutorial = fight.tutorial;
    if (tutorial?.phase !== 'try' || this.scene.isActive('pause')) return;
    playSfx(this, 'ui_confirm');
    tutorial.replayDemo(fight.state);
  }

  private showLesson(lesson: Lesson | null, index: number, total: number): void {
    if (!lesson) {
      this.progress.setText('Tutorial');
      this.title.setText('Pronto para lutar!');
      this.body.setText(
        'Agora é treino livre com o boneco. Os outros personagens você descobre jogando: cada um tem o seu especial. Esc abre a pausa para voltar ao menu.',
      );
      this.hint.setText('');
    } else {
      const controls = getControls();
      this.progress.setText(`Lição ${String(index + 1)} de ${String(total)}`);
      this.title.setText(lesson.title);
      this.body.setText(lesson.text);
      this.hint.setText(lesson.buttons.map((b) => buttonHint(controls, b)).join('\n'));
    }
    const hintY = this.body.y + this.body.height + 10;
    this.hint.setY(hintY);
    const bottom =
      (this.hint.text ? hintY + this.hint.height : this.body.y + this.body.height) + 16;
    this.replay.setPosition(PANEL_X + PANEL_W, bottom + 10);
    this.gfx.clear();
    panel(this.gfx, PANEL_X, PANEL_Y, PANEL_W, bottom - PANEL_Y, UI.panelDark, 0.86);
  }

  private get fight(): FightScene {
    return this.scene.get('fight') as FightScene;
  }
}
