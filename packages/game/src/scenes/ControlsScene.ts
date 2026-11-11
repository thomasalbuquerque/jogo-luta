import Phaser from 'phaser';
import type { ButtonName } from '@jogo-luta/sim';
import { playSfx } from '../audio/sfx';
import { addAudioHint } from '../audio/unlock';
import { BUTTON_NAMES, PAD_ACTIONS, PAD_START, type PadAction } from '../input/bindings';
import {
  bindKey,
  bindPadButton,
  DEFAULT_CONTROLS,
  getControls,
  isReservedKey,
  isReservedPadButton,
  keyLabel,
  padButtonLabel,
  setControls,
} from '../input/controls';
import { readPads } from '../input/InputManager';
import { Menu } from '../input/menu';
import { MenuInput } from '../input/menuInput';
import { BUTTON_LABELS, keysText, padText } from '../ui/controlsCard';
import { cssColor, fadeIn, playerColor, titleText, UI, uiText } from '../ui/theme';

const PLAYERS = 2;
/** Colunas: teclado do P1, teclado do P2, controle. */
const COLUMNS = 3;
const COL_X = [520, 770, 1020];
const COL_W = 220;
const LABEL_X = 150;
const TABLE_Y = 150;
const ROW_H = 40;
const CELL_H = 32;
/** Linhas depois da tabela: restaurar o padrão e voltar. */
const RESET_ROW = BUTTON_NAMES.length;
const BACK_ROW = RESET_ROW + 1;
const BUTTON_W = 320;

function isPadAction(name: ButtonName): name is PadAction {
  return (PAD_ACTIONS as readonly string[]).includes(name);
}

/**
 * Remapear controles: uma tabela com as teclas do P1 e do P2 e os botões do
 * controle. Confirmar numa casa espera a nova tecla (Esc cancela). Uma tecla só
 * serve a um botão: se já era usada, os dois trocam. Fica salvo no navegador.
 */
export class ControlsScene extends Phaser.Scene {
  private controls!: MenuInput;
  private row = 0;
  private col = 0;
  /** Esperando a tecla ou o botão novo. */
  private capturing = false;
  /** Botões do controle já apertados quando a espera começou (não contam). */
  private padHeld: boolean[] = [];
  private gfx!: Phaser.GameObjects.Graphics;
  private cells: Phaser.GameObjects.Text[][] = [];
  private buttons: Phaser.GameObjects.Text[] = [];
  private message!: Phaser.GameObjects.Text;

  constructor() {
    super('controls');
  }

  create(): void {
    const { width, height } = this.scale;
    this.row = 0;
    this.col = 0;
    this.capturing = false;
    this.controls = new MenuInput();
    window.addEventListener('keydown', this.onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
      window.removeEventListener('keydown', this.onKeyDown);
    });
    fadeIn(this);
    addAudioHint(this, 2);
    titleText(this, width / 2, 50, 'CONTROLES', 40);

    this.gfx = this.add.graphics();
    const header = ['P1 (teclado)', 'P2 (teclado)', 'Controle'];
    header.forEach((label, c) => {
      uiText(this, COL_X[c] ?? 0, TABLE_Y - 34, label, {
        fontSize: '18px',
        fontStyle: 'bold',
        color: c < 2 ? cssColor(playerColor(c)) : UI.muted,
      }).setOrigin(0.5);
    });
    this.cells = BUTTON_NAMES.map((name, r) => {
      const y = this.rowY(r);
      uiText(this, LABEL_X, y, BUTTON_LABELS[name], {
        fontSize: '19px',
        color: UI.muted,
      }).setOrigin(0, 0.5);
      return Array.from({ length: COLUMNS }, (_, c) =>
        uiText(this, COL_X[c] ?? 0, y, '', { fontSize: '19px', fontStyle: 'bold' }).setOrigin(0.5),
      );
    });
    this.buttons = ['Restaurar padrão', 'Voltar'].map((label, i) =>
      uiText(this, width / 2, this.rowY(RESET_ROW + i), label, {
        fontSize: '20px',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    );
    this.message = uiText(this, width / 2, height - 62, '', {
      fontSize: '18px',
      color: '#ffd166',
    }).setOrigin(0.5);
    uiText(
      this,
      width / 2,
      height - 26,
      'Enter ou Ataque: trocar a tecla · Esc ou Especial: voltar · Uma tecla só vale para um botão: se já for usada, os dois trocam',
      { fontSize: '14px', color: UI.muted },
    ).setOrigin(0.5);
    this.refresh();
  }

  override update(_time: number, delta: number): void {
    if (this.capturing) {
      this.capturePad();
      return;
    }
    const actions = this.controls.poll(PLAYERS, delta).any;
    if (actions & Menu.BACK) {
      this.back();
      return;
    }
    const rows = BACK_ROW + 1;
    let moved = false;
    if (actions & Menu.UP) {
      this.row = (this.row + rows - 1) % rows;
      moved = true;
    }
    if (actions & Menu.DOWN) {
      this.row = (this.row + 1) % rows;
      moved = true;
    }
    if (this.row < RESET_ROW && actions & (Menu.LEFT | Menu.RIGHT)) {
      this.col = (this.col + (actions & Menu.LEFT ? COLUMNS - 1 : 1)) % COLUMNS;
      moved = true;
    }
    if (moved) {
      playSfx(this, 'ui_move');
      this.message.setText('');
      this.refresh();
    }
    if (actions & Menu.CONFIRM) this.confirm();
  }

  private rowY(row: number): number {
    // os botões de baixo ficam um pouco separados da tabela
    return TABLE_Y + row * ROW_H + (row >= RESET_ROW ? 24 : 0);
  }

  private get action(): ButtonName | undefined {
    return BUTTON_NAMES[this.row];
  }

  private confirm(): void {
    if (this.row === BACK_ROW) {
      this.back();
      return;
    }
    if (this.row === RESET_ROW) {
      setControls(DEFAULT_CONTROLS);
      playSfx(this, 'ui_confirm');
      this.message.setText('Controles de volta ao padrão.');
      this.refresh();
      return;
    }
    const action = this.action;
    if (!action) return;
    if (this.col === 2 && !isPadAction(action)) {
      playSfx(this, 'ui_error');
      this.message.setText('No controle, andar é sempre no analógico ou no D-pad.');
      return;
    }
    playSfx(this, 'ui_confirm');
    this.capturing = true;
    this.padHeld = this.padButtons();
    this.message.setText(
      this.col === 2
        ? 'Aperte o botão novo no controle (Start cancela)'
        : 'Aperte a tecla nova (Esc cancela)',
    );
    this.refresh();
  }

  private back(): void {
    playSfx(this, 'ui_back');
    this.scene.start('title', { menu: true });
  }

  /** Esperando a tecla nova: a 1ª tecla apertada vira a do botão escolhido. */
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (!this.capturing || e.repeat) return;
    e.preventDefault();
    if (e.code === 'Escape') {
      this.stopCapture('Cancelado.');
      return;
    }
    if (this.col === 2) return; // esperando botão do controle
    const action = this.action;
    if (!action) return;
    if (isReservedKey(e.code)) {
      playSfx(this, 'ui_error');
      this.message.setText(`${keyLabel(e.code)} é reservada (menus, som e debug). Escolha outra.`);
      return;
    }
    setControls(bindKey(getControls(), this.col, action, e.code));
    playSfx(this, 'ui_confirm');
    this.stopCapture(`P${String(this.col + 1)} · ${BUTTON_LABELS[action]}: ${keyLabel(e.code)}`);
  };

  /** Esperando o botão novo do controle (qualquer controle conectado). */
  private capturePad(): void {
    if (this.col !== 2) return;
    const now = this.padButtons();
    const pressed = now.findIndex((down, i) => down && !this.padHeld[i]);
    this.padHeld = now;
    if (pressed < 0) return;
    if (pressed === PAD_START) {
      this.stopCapture('Cancelado.');
      return;
    }
    const action = this.action;
    if (!action || !isPadAction(action)) return;
    if (isReservedPadButton(pressed)) {
      playSfx(this, 'ui_error');
      this.message.setText(`${padButtonLabel(pressed)} não dá para usar. Escolha outro botão.`);
      return;
    }
    setControls(bindPadButton(getControls(), action, pressed));
    playSfx(this, 'ui_confirm');
    this.stopCapture(`Controle · ${BUTTON_LABELS[action]}: ${padButtonLabel(pressed)}`);
  }

  private stopCapture(message: string): void {
    this.capturing = false;
    this.message.setText(message);
    // a tecla ou o botão usado agora não conta como aperto no menu
    this.controls.reset();
    this.refresh();
  }

  /** Botões apertados em qualquer controle. */
  private padButtons(): boolean[] {
    const out: boolean[] = [];
    for (const pad of readPads()) {
      pad.buttons.forEach((down, i) => {
        out[i] = (out[i] ?? false) || down;
      });
    }
    return out;
  }

  private refresh(): void {
    const c = getControls();
    const g = this.gfx;
    g.clear();
    BUTTON_NAMES.forEach((name, r) => {
      const y = this.rowY(r);
      const row = this.cells[r] ?? [];
      for (let col = 0; col < COLUMNS; col++) {
        const selected = r === this.row && col === this.col;
        const editable = col < 2 || isPadAction(name);
        const x = (COL_X[col] ?? 0) - COL_W / 2;
        g.fillStyle(selected ? UI.accent : UI.panel, editable ? 1 : 0.4);
        g.fillRoundedRect(x, y - CELL_H / 2, COL_W, CELL_H, 8);
        const text =
          selected && this.capturing
            ? '...'
            : col < 2
              ? keysText(c.keys[col]?.[name] ?? [])
              : isPadAction(name)
                ? padText(c.pad[name])
                : 'Analógico / D-pad';
        row[col]
          ?.setText(text)
          .setColor(selected ? '#1d2333' : editable ? UI.text : UI.dim)
          .setFontStyle(editable ? 'bold' : 'normal');
      }
    });
    this.buttons.forEach((label, i) => {
      const selected = this.row === RESET_ROW + i;
      const y = this.rowY(RESET_ROW + i);
      g.fillStyle(selected ? UI.accent : UI.panel, 1);
      g.fillRoundedRect(this.scale.width / 2 - BUTTON_W / 2, y - CELL_H / 2, BUTTON_W, CELL_H, 8);
      label.setColor(selected ? '#1d2333' : UI.text);
    });
  }
}
