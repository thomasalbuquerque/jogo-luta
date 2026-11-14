import Phaser from 'phaser';
import { playSfx } from '../audio/sfx';
import { getControls } from '../input/controls';
import { readPads } from '../input/InputManager';
import { Menu } from '../input/menu';
import { MenuInput } from '../input/menuInput';
import { VIEW } from '../render/view';
import type { TutorialPhase } from '../tutorial/director';
import type { Lesson } from '../tutorial/lessons';
import {
  buttonHint,
  finishedPrompt,
  footerPrompt,
  formatPrompt,
  replayButton,
  type TutorialDevice,
} from '../tutorial/prompts';
import { MenuList } from '../ui/MenuList';
import { panel, titleText, UI, uiText } from '../ui/theme';
import type { FightScene } from './FightScene';

const PANEL_W = 1080;
const PANEL_X = (VIEW.width - PANEL_W) / 2;
const PANEL_Y = 14;
/** Jogadores que podem mexer na escolha (teclado e controle de cada um). */
const PLAYERS = 2;

const PHASE_LOOK: Record<TutorialPhase, { label: string; color: number }> = {
  intro: { label: '', color: 0x4cc9f0 },
  demo: { label: '▶  VEJA COMO FAZ', color: 0x4cc9f0 },
  try: { label: 'SUA VEZ!', color: 0xffd166 },
  done: { label: '✓  BOA!', color: 0x80ed99 },
  finished: { label: '✓  TUTORIAL CONCLUÍDO', color: 0x80ed99 },
};

/** Tecla de ver a demonstração de novo (Tab é reservada: nenhum botão do jogo usa). */
const REPLAY_KEY = 'TAB';
const REPLAY_BG = '#4cc9f0';
const REPLAY_BG_HOVER = '#8ddcf6';

/**
 * Painel do tutorial por cima da luta (no lugar do HUD). No começo pergunta se a
 * pessoa vai jogar no teclado ou no controle; depois mostra a lição, o que fazer
 * (com as teclas ou os botões do que ela escolheu) e em que fase está.
 */
export class TutorialScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private progress!: Phaser.GameObjects.Text;
  private title!: Phaser.GameObjects.Text;
  private body!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private badge!: Phaser.GameObjects.Text;
  private footer!: Phaser.GameObjects.Text;
  /** "Ver de novo": repete a demonstração da lição (clique ou Tab), na vez do jogador. */
  private replay!: Phaser.GameObjects.Text;
  /** Escolha de teclado ou controle (só no começo). */
  private choice: Phaser.GameObjects.GameObject[] = [];
  private choiceMenu: MenuList | null = null;
  private controls: MenuInput | null = null;
  private shown = '';
  private shownPhase: TutorialPhase | null = null;

  constructor() {
    super('tutorial');
  }

  create(): void {
    this.shown = '';
    this.shownPhase = null;
    this.choice = [];
    this.choiceMenu = null;
    this.controls = null;
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
    this.replay = uiText(this, PANEL_X + PANEL_W, 0, '', {
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
    this.footer = uiText(this, VIEW.width / 2, VIEW.height - 22, '', {
      fontSize: '16px',
      color: UI.muted,
      stroke: '#0b0e16',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls?.destroy();
    });
  }

  override update(_time: number, delta: number): void {
    const tutorial = this.fight.tutorial;
    if (!tutorial) return;
    if (tutorial.phase === 'intro') {
      this.updateChoice(delta);
      return;
    }
    if (this.choiceMenu) this.closeChoice();
    const device = tutorial.device ?? 'keyboard';
    const key = `${String(tutorial.index)}|${device}`;
    if (key !== this.shown) {
      this.shown = key;
      this.showLesson(tutorial.lesson, tutorial.index, tutorial.lessons.length, device);
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

  /** Teclado ou controle: abre a escolha no 1º quadro e trata o input dela. */
  private updateChoice(delta: number): void {
    if (!this.choiceMenu) this.openChoice();
    this.setLessonVisible(false);
    // a pausa (janela perdeu o foco) fica por cima e usa as mesmas teclas
    if (this.scene.isActive('pause') || !this.controls || !this.choiceMenu) return;
    const frame = this.controls.poll(PLAYERS, delta);
    if (frame.any & Menu.BACK) {
      playSfx(this, 'ui_back');
      this.fight.leave('title');
      return;
    }
    this.choiceMenu.handle(frame.any);
  }

  private openChoice(): void {
    const { width, height } = VIEW;
    this.controls = new MenuInput();
    const shade = this.add.rectangle(0, 0, width, height, 0x05070b, 0.55).setOrigin(0);
    const title = titleText(this, width / 2, 170, 'COMO VOCÊ VAI JOGAR?', 52, '#ffd166');
    const sub = uiText(
      this,
      width / 2,
      232,
      'O tutorial vai mostrar os botões do que você escolher.',
      { fontSize: '20px', stroke: '#0b0e16', strokeThickness: 4 },
    ).setOrigin(0.5);
    const back = uiText(this, width / 2, height - 22, 'Esc: voltar ao menu', {
      fontSize: '16px',
      color: UI.muted,
      stroke: '#0b0e16',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.choice = [shade, title, sub, back];
    const pick = (device: TutorialDevice) => () => {
      const fight = this.fight;
      fight.tutorial?.choose(fight.state, device);
    };
    this.choiceMenu = new MenuList(
      this,
      [
        { label: 'Teclado', onSelect: pick('keyboard') },
        { label: 'Controle (joystick)', onSelect: pick('pad') },
      ],
      { x: width / 2, y: 320, width: 420, height: 60, fontSize: 28 },
    );
    // com controle conectado, já sugere o controle
    if (readPads().length > 0) this.choiceMenu.setIndex(1);
  }

  private closeChoice(): void {
    for (const o of this.choice) o.destroy();
    this.choice = [];
    this.choiceMenu?.setVisible(false);
    this.choiceMenu = null;
    this.controls?.destroy();
    this.controls = null;
    this.setLessonVisible(true);
  }

  private setLessonVisible(visible: boolean): void {
    for (const o of [this.gfx, this.progress, this.title, this.body, this.hint, this.badge]) {
      o.setVisible(visible);
    }
    this.footer.setVisible(visible);
    if (!visible) this.replay.setVisible(false);
  }

  /** Mostra de novo a demonstração da lição atual (só na vez do jogador, fora da pausa). */
  private replayDemo(): void {
    if (this.scene.isActive('pause')) return;
    this.fight.replayTutorialDemo();
  }

  private showLesson(
    lesson: Lesson | null,
    index: number,
    total: number,
    device: TutorialDevice,
  ): void {
    const controls = getControls();
    this.footer.setText(footerPrompt(device));
    this.replay.setText(`↺  Ver de novo (${replayButton(device)})`);
    if (!lesson) {
      this.progress.setText('Tutorial');
      this.title.setText('Pronto para lutar!');
      this.body.setText(finishedPrompt(device));
      this.hint.setText('');
    } else {
      this.progress.setText(`Lição ${String(index + 1)} de ${String(total)}`);
      this.title.setText(lesson.title);
      this.body.setText(formatPrompt(lesson.text, controls, device));
      this.hint.setText(lesson.buttons.map((b) => buttonHint(controls, device, b)).join('\n'));
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
