import Phaser from 'phaser';
import {
  activeHitboxes,
  createReplay,
  currentMove,
  finishReplay,
  FixedStepLoop,
  getStage,
  hashState,
  hurtbox,
  InputDelay,
  isActiveFrame,
  isCountering,
  moveFrame,
  NO_INPUT,
  PLAYABLE_CHARACTERS,
  recordInputs,
  replayGame,
  replayInputs,
  replayLength,
  replayMatches,
  STAGES,
  stepGame,
  SUBPX,
  toPx,
  type Box,
  type CueName,
  type Fighter,
  type FighterState,
  type GameState,
  type HitEvent,
  type InputMask,
  type KoEvent,
  type Replay,
} from '@jogo-luta/sim';
import { music } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { playKoVoice, playVoice } from '../audio/voice';
import { delaysFromSearch } from '../input/delay';
import { InputManager } from '../input/InputManager';
import { Menu, type MenuMask } from '../input/menu';
import { newSeed } from '../match/replayFile';
import { createStats, recordEvents, type MatchStats } from '../match/stats';
import { rulesFor } from '../match/teams';
import { closeOnline, getOnline } from '../net/online';
import { onlineRoute } from '../net/route';
import type { OnlineMatch, OnlineSession } from '../net/session';
import {
  DEFAULT_CAMERA,
  frameTargets,
  smooth,
  type CameraOptions,
  type Rect,
} from '../render/camera';
import { isDecisiveHit } from '../render/decisive';
import { characterOfFighter, colorValue } from '../render/fighterLook';
import { FighterView, characterTextureKey } from '../render/FighterView';
import { CHARACTER_FX, FxLayer } from '../render/fx';
import { FX_TEXTURE } from '../render/fxTextures';
import {
  hitStrength,
  spawnDust,
  spawnHitBurst,
  spawnRespawnGlow,
  spawnTrailPuff,
  TRAIL_MIN_KNOCKBACK,
} from '../render/impact';
import { exitDirection, koEdgePoint } from '../render/koEdge';
import { hitTrauma, Shake } from '../render/shake';
import { SlowMo } from '../render/slowmo';
import { StageView } from '../render/stageView';
import { fighterPose } from '../rig/fighterPose';
import { fighterColor } from '../ui/theme';
import type { HudScene } from './HudScene';

const STAGE_DEBUG_COLOR = 0x80ed99;
const HITBOX_COLOR = 0xff3b30;
const HURTBOX_COLOR = 0xffd166;
const HURTBOX_INVULN_COLOR = 0x9aa0a6;
/** Pulo de posição maior que isso entre ticks (respawn) não é interpolado. */
const TELEPORT_PX = 150;
const CAMERA_RATE = 5;
/** Ticks de clarão branco em quem leva golpe (mais nos golpes fortes). */
const FLASH_TICKS = 3;
/** Tremor do KO (trauma, 0..1). */
const KO_TRAUMA = 0.8;
/** Golpe que decide a luta: câmera lenta (tempo real e escala) e zoom em quem voa. */
const DECISIVE_SLOWMO_MS = 1300;
const DECISIVE_SLOWMO_SCALE = 0.2;
const FOCUS_CAMERA_RATE = 12;
const FOCUS_CAMERA: CameraOptions = {
  ...DEFAULT_CAMERA,
  padding: 90,
  minWidth: 520,
  minHeight: 300,
  maxZoom: 1.7,
};
/** Luta que acabou sem o golpe decisivo aparecer (caiu sozinho): câmera lenta mais curta. */
const FINAL_KO_SLOWMO_MS = 700;
const FINAL_KO_SLOWMO_SCALE = 0.35;
/** Ticks depois do fim da luta antes da tela de resultado (dá tempo de ver o último KO). */
const RESULT_DELAY_TICKS = 60;
/** Depois de voltar da pausa, ignora pedir pausa de novo por este tempo (a tecla que voltou). */
const PAUSE_COOLDOWN_MS = 250;
/** Teclas que pausam: Enter, Esc, Start e Select do controle. */
const PAUSE_KEYS = Menu.CONFIRM | Menu.BACK | Menu.START;
/** Online: os dois lados trocam o hash do estado a cada tantos ticks (0,5 s). */
const HASH_EVERY_TICKS = 30;
/** Enquadramento da câmera quando ninguém está em cena. */
const STAGE_VIEW: Rect = { x: -450, y: -200, w: 900, h: 200 };

/** Camadas de desenho (depth do Phaser). */
const DEPTH = {
  background: -10,
  stage: 0,
  decoration: 2,
  /** Rastro de arremesso e poeira: atrás dos lutadores. */
  backFx: 5,
  fighters: 10,
  fx: 20,
  projectiles: 25,
  ui: 30,
  debug: 40,
};

/** Registro do Phaser: modo debug ligado (overlay de texto + caixas). */
export const DEBUG_KEY = 'debug';

/** O que foi escolhido nos menus: personagem de cada jogador, mapa e times. */
export interface MatchSetup {
  /** Id da ficha de cada jogador, na ordem. */
  characters: readonly string[];
  stageId: string;
  /** Time de cada jogador (sem valor ou null: todos contra todos). */
  teams?: readonly number[] | null;
  /** Fogo amigo (só vale com times). */
  friendlyFire?: boolean;
}

/** Dados para abrir a luta: o que foi escolhido nos menus, ou um replay para assistir. */
export interface FightData extends Partial<MatchSetup> {
  replay?: Replay;
}

/** O setup da partida online (o que a sala mandou). */
function matchSetup(match: OnlineMatch): MatchSetup {
  return {
    characters: match.characters,
    stageId: match.stageId,
    teams: match.teams,
    friendlyFire: match.friendlyFire,
  };
}

/** Telas para onde dá para sair da luta (pausa e resultado). */
export type LeaveTarget = 'select' | 'stage' | 'title' | 'online';

interface PrevPos {
  x: number;
  y: number;
}

/**
 * Luta: roda o sim em passo fixo e desenha o estado interpolado.
 *
 * Online (sala aberta), os inputs passam pelo lockstep da sala: o tick só roda
 * quando o input dos dois chegou, e os dois lados veem a mesma luta.
 */
export class FightScene extends Phaser.Scene {
  state!: GameState;
  /** Último input enviado ao sim, por jogador (para o overlay de debug). */
  lastInputs: InputMask[] = [];
  /** Ticks desde que a luta acabou. */
  overTicks = 0;
  /** KOs, quedas e dano de cada jogador nesta luta. */
  stats: MatchStats = createStats(0);
  setup: MatchSetup = { characters: PLAYABLE_CHARACTERS, stageId: STAGES[0]?.id ?? '' };
  /**
   * Atraso de input por jogador, para sentir o netcode por atraso sem rede
   * (`?atraso=3` na URL, ou as teclas do modo debug). Vale entre lutas.
   */
  readonly inputDelay = new InputDelay(delaysFromSearch(window.location.search));
  /** Replay sendo assistido (null = luta de verdade, com os controles). */
  playback: Replay | null = null;
  /** No fim de um replay: reproduziu a luta gravada? (null = ainda rodando, ou luta de verdade) */
  replayOk: boolean | null = null;
  /** Sala online (null = jogo local). */
  net: OnlineSession | null = null;
  /** Online: o último tick não rodou porque faltava o input do outro jogador. */
  stalled = false;
  /** Online: há quanto tempo está parado esperando o input do outro (ms). */
  stalledMs = 0;

  /** Gravação da luta em andamento (seed + inputs de cada tick). */
  private recording: Replay | null = null;
  /** A gravação fechou: a luta acabou e o replay está completo. */
  private recorded = false;

  /** Online: id da partida que está rodando (muda na revanche). */
  private matchId = -1;
  /** Online: o menu de pausa estava aberto no tick anterior. */
  private menuWasOpen = false;
  /** Já pediu para sair da luta: não faz mais nada até a cena fechar. */
  private leaving = false;
  private readonly loop = new FixedStepLoop();
  private controls!: InputManager;
  private pauseRequested = false;
  /** Teclas fixas (Enter, Esc, Start) no tick anterior: pausa só no aperto. */
  private prevSystem: MenuMask = 0;
  private resumedAt = 0;
  private prev: PrevPos[] = [];
  private lastStates: FighterState[] = [];
  private views: FighterView[] = [];
  private fx!: FxLayer;
  private backFx!: FxLayer;
  private readonly shake = new Shake();
  private readonly slowMo = new SlowMo();
  /** Câmera sem o tremor (o tremor é somado só na hora de posicionar). */
  private camPos = { x: 0, y: 0, zoom: 1 };
  /** Tick até o qual cada lutador fica branco (clarão do impacto). */
  private flashUntil: number[] = [];
  /** Lutador em foco na câmera lenta do golpe decisivo. */
  private focus: number | null = null;
  /** O golpe decisivo (ou o KO final) já ganhou câmera lenta nesta luta. */
  private decisiveShown = false;
  private projectileImages: Phaser.GameObjects.Image[] = [];
  private projectileTrails: Phaser.GameObjects.Image[] = [];
  private overlayGfx!: Phaser.GameObjects.Graphics;
  private debugGfx!: Phaser.GameObjects.Graphics;
  private bubbles: Phaser.GameObjects.Text[] = [];
  private stageView!: StageView;

  constructor() {
    super('fight');
  }

  init(data: FightData): void {
    this.playback = data.replay ?? null;
    this.net = getOnline();
    this.leaving = false;
    const replay = data.replay;
    this.setup = replay
      ? {
          characters: replay.characters,
          stageId: replay.stageId,
          teams: replay.teams ?? null,
          friendlyFire: replay.rules.friendlyFire === true,
        }
      : {
          characters: data.characters ?? PLAYABLE_CHARACTERS,
          stageId: data.stageId ?? STAGES[0]?.id ?? '',
          teams: data.teams ?? null,
          friendlyFire: data.friendlyFire === true,
        };
  }

  create(): void {
    // debug ligado por padrão só no `pnpm dev` (` liga e desliga)
    if (this.registry.get(DEBUG_KEY) === undefined) {
      this.registry.set(DEBUG_KEY, import.meta.env.DEV);
    }
    this.views = [];
    this.projectileImages = [];
    this.projectileTrails = [];
    this.fx = new FxLayer(this, DEPTH.fx);
    this.backFx = new FxLayer(this, DEPTH.backFx);
    this.newMatch();
    this.controls = new InputManager();
    this.pauseRequested = false;
    this.prevSystem = PAUSE_KEYS; // segurado desde o menu não pausa
    const requestPause = () => {
      // online a luta não para: perder o foco não abre o menu
      if (!this.net) this.pauseRequested = true;
    };
    // trocar de janela ou de aba no meio da luta pausa
    this.game.events.on(Phaser.Core.Events.BLUR, requestPause);
    this.game.events.on(Phaser.Core.Events.HIDDEN, requestPause);
    this.events.on(Phaser.Scenes.Events.RESUME, this.onResume);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
      this.game.events.off(Phaser.Core.Events.BLUR, requestPause);
      this.game.events.off(Phaser.Core.Events.HIDDEN, requestPause);
      this.events.off(Phaser.Scenes.Events.RESUME, this.onResume);
    });

    this.stageView = new StageView(this, getStage(this.state.stageId), DEPTH);
    this.views = this.state.fighters.map((f) =>
      new FighterView(this, f.character, toPx(f.stats.height)).setDepth(DEPTH.fighters + f.id),
    );
    this.overlayGfx = this.add.graphics().setDepth(DEPTH.ui);
    this.debugGfx = this.add.graphics().setDepth(DEPTH.debug);
    this.bubbles = this.state.fighters.map(() =>
      this.add
        .text(0, 0, '', {
          fontFamily: 'sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#111111',
          backgroundColor: '#ffffff',
          padding: { x: 8, y: 5 },
        })
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.ui)
        .setVisible(false),
    );

    const cam = this.cameras.main;
    const target = this.cameraTarget(0);
    this.camPos = { ...target };
    cam.setZoom(target.zoom);
    cam.centerOn(target.x, target.y);

    this.scene.launch('hud');
    this.scene.launch('debug');
    music.play(this, 'luta');
  }

  override update(_time: number, delta: number): void {
    // a pausa e o resultado rodam antes desta cena no quadro: podem já ter pedido a saída
    if (this.leaving || this.followRoom()) return;
    if (this.wantsPause()) {
      this.openPause();
      // online o menu abre por cima e a luta continua
      if (!this.net) return;
    }
    const timeScale = this.slowMo.update(delta);
    if (!this.slowMo.active) this.focus = null;
    let alpha = this.loop.advance(delta * timeScale, () => {
      this.tick();
    });
    // parado esperando o outro jogador: desenha o último tick, sem interpolar
    if (this.stalled) {
      alpha = 1;
      this.stalledMs += delta;
    } else {
      this.stalledMs = 0;
    }
    this.drawFighters(alpha);
    this.drawProjectiles(alpha);
    this.updateTaunts(alpha);
    this.updateCamera(alpha, delta);
  }

  /** Partida online em andamento (null = jogo local, ou assistindo a um replay). */
  get onlineMatch(): OnlineMatch | null {
    return this.playback ? null : (this.net?.match ?? null);
  }

  /**
   * Online: segue a tela da sala. Sala acabou ou mudou de tela: sai da luta
   * (devolve true). Partida nova (revanche): começa de novo aqui mesmo.
   */
  private followRoom(): boolean {
    const net = this.net;
    if (!net) return false;
    // com a luta já no resultado, a sala que acabou só é avisada lá (dá para salvar o replay)
    if (net.ended && (this.ended || this.playback)) return false;
    const route = onlineRoute(net, 'fight');
    if (route) {
      this.exit(route.scene, route.data);
      return true;
    }
    const match = net.match;
    if (match && match.seq !== this.matchId) {
      // revanche com menos gente (alguém saiu da sala): monta a luta de novo, com HUD e lutadores certos
      if (match.characters.length !== this.state.fighters.length) {
        this.exit('fight', matchSetup(match));
        return true;
      }
      this.playback = null;
      this.rematch();
    }
    return false;
  }

  /** Replay da luta que acabou (ou o que está sendo assistido), para ver de novo ou salvar. */
  get replay(): Replay | null {
    return this.playback ?? (this.recorded ? this.recording : null);
  }

  /** Seed da luta em andamento (ou do replay sendo assistido). */
  get seed(): number {
    return (this.playback ?? this.recording)?.seed ?? 0;
  }

  /** A luta chegou ao fim (num replay: a fita acabou, mesmo que a luta tenha saído diferente). */
  get ended(): boolean {
    if (this.state.phase === 'over') return true;
    return this.playback !== null && this.state.tick >= replayLength(this.playback);
  }

  /**
   * Começa uma luta nova (início e revanche), com os mesmos personagens e mapa.
   * Assistindo a um replay, começa o replay do tick 0.
   */
  newMatch(): void {
    if (this.playback) {
      this.recording = null;
      this.state = replayGame(this.playback);
    } else {
      // online: personagens, mapa e seed são os da partida da sala (iguais nos dois lados)
      const match = this.net?.match;
      if (match) {
        this.matchId = match.seq;
        this.setup = matchSetup(match);
      }
      // a seed é sorteada fora do sim; dentro dele, tudo sai dela
      const seed = match?.seed ?? newSeed();
      const teams = this.setup.teams ? [...this.setup.teams] : null;
      const rules = rulesFor({ teams, friendlyFire: this.setup.friendlyFire === true });
      this.recording = createReplay({ ...this.setup, teams, rules, seed });
      this.state = replayGame(this.recording);
    }
    this.recorded = false;
    this.replayOk = null;
    this.inputDelay.reset();
    this.stalled = false;
    this.stalledMs = 0;
    this.menuWasOpen = false;
    this.stats = createStats(this.state.fighters.length);
    this.prev = this.state.fighters.map((f) => ({ x: f.x, y: f.y }));
    this.lastStates = this.state.fighters.map((f) => f.state);
    this.overTicks = 0;
    this.loop.reset();
    this.fx.clear();
    this.backFx.clear();
    this.shake.reset();
    this.slowMo.reset();
    this.flashUntil = [];
    this.focus = null;
    this.decisiveShown = false;
  }

  /** Assiste ao replay da luta que acabou (ou de novo ao que está passando). */
  watchReplay(): void {
    const replay = this.replay;
    if (!replay) return;
    this.playback = replay;
    this.rematch();
  }

  /** Sai do replay e joga a mesma luta (personagens e mapa) de verdade. */
  playLive(): void {
    this.playback = null;
    this.rematch();
  }

  /** Revanche (resultado) ou recomeçar (pausa): mesma luta do zero, com a contagem. */
  rematch(): void {
    this.scene.stop('result');
    if (this.net) this.scene.stop('pause');
    this.newMatch();
    this.controls.suppressHeld();
    this.pauseRequested = false;
    // o Enter que confirmou a revanche ainda está apertado: não é um pedido de pausa
    this.prevSystem = PAUSE_KEYS;
  }

  /** Sai da luta para outra tela, levando o que foi escolhido. */
  leave(target: LeaveTarget): void {
    const net = this.net;
    if (net?.ended && target !== 'title') target = 'online';
    if (net && !net.ended && (target === 'select' || target === 'stage')) {
      // online: a sala inteira troca de tela (quem entrou pede ao host) e a luta segue a sala
      net.openSelect();
      return;
    }
    if (target === 'title') this.exit('title', { menu: true });
    else if (target === 'online') this.exit('online', { ended: net?.ended ?? 'quit' });
    else this.exit(target, this.setup);
  }

  /** Fecha a luta e o que está por cima dela, e abre outra tela. */
  private exit(scene: string, data: object): void {
    if (this.leaving) return;
    this.leaving = true;
    if (scene === 'title' || scene === 'online') closeOnline();
    for (const key of ['hud', 'debug', 'pause', 'result']) this.scene.stop(key);
    this.scene.start(scene, data);
  }

  /** Esc, Enter ou Start do controle (ou perder o foco), com a luta ainda rolando. */
  private wantsPause(): boolean {
    const requested = this.pauseRequested;
    this.pauseRequested = false;
    if (!requested || this.ended || this.scene.isActive('pause')) return false;
    return this.game.loop.time - this.resumedAt >= PAUSE_COOLDOWN_MS;
  }

  private openPause(): void {
    playSfx(this, 'ui_confirm');
    this.scene.launch('pause');
    if (!this.net) this.scene.pause();
  }

  /** Voltando da pausa: o que estiver apertado só conta depois de soltar. */
  private readonly onResume = (): void => {
    this.controls.suppressHeld();
    this.inputDelay.reset();
    this.pauseRequested = false;
    this.prevSystem = PAUSE_KEYS;
    this.resumedAt = this.game.loop.time;
  };

  private tick(): void {
    // lê os controles mesmo num replay: as teclas de pausa vêm daqui
    const sampled = this.controls.sample(this.state.fighters.length);
    const system = this.controls.system & PAUSE_KEYS;
    if (system & ~this.prevSystem) this.pauseRequested = true;
    this.prevSystem = system;

    const inputs = this.nextInputs(sampled);
    this.stalled = inputs === null;
    if (!inputs) return;
    for (const [i, f] of this.state.fighters.entries()) this.prev[i] = { x: f.x, y: f.y };
    if (this.ended) {
      this.overTicks++;
      if (this.overTicks === RESULT_DELAY_TICKS) this.scene.launch('result');
    }
    this.lastInputs = inputs;
    this.stepRecorded(inputs);
    this.checkHash();
    recordEvents(this.stats, this.state.events);
    this.handleEvents();
    this.spawnTrails();
    this.spawnFx();
    this.fx.step();
    this.backFx.step();
  }

  /**
   * Inputs do tick: do replay, dos controles (jogo local) ou do lockstep da sala
   * (online). Online, null = ainda falta o input do outro jogador: o tick não roda.
   */
  private nextInputs(sampled: readonly InputMask[]): InputMask[] | null {
    if (this.playback) return replayInputs(this.playback, this.state.tick);
    const net = this.net;
    const match = net?.match;
    if (!net || !match) return this.inputDelay.push(sampled);
    // os inputs que faltam para o outro lado continuam indo, mesmo depois do fim
    if (this.state.phase === 'over') {
      net.sendInputs();
      return this.state.fighters.map(() => NO_INPUT);
    }
    // este PC é um jogador só: vale qualquer um dos controles. Com o menu aberto, nada
    const menuOpen = this.scene.isActive('pause');
    if (this.menuWasOpen && !menuOpen) this.controls.suppressHeld();
    this.menuWasOpen = menuOpen;
    const mine = menuOpen ? NO_INPUT : sampled.reduce((a, b) => a | b, NO_INPUT);
    match.lockstep.addLocal(mine);
    net.sendInputs();
    return match.lockstep.ready() ? match.lockstep.step() : null;
  }

  /** Online: de tempos em tempos (e no fim da luta), manda o hash do estado para comparar. */
  private checkHash(): void {
    const net = this.net;
    if (!net || !this.onlineMatch || this.overTicks > 0) return;
    const over = this.state.phase === 'over';
    if (over || this.state.tick % HASH_EVERY_TICKS === 0) {
      net.reportHash(this.state.tick, hashState(this.state));
    }
  }

  /**
   * Avança o sim 1 tick. Luta de verdade: grava os inputs até ela acabar e fecha
   * a gravação com o hash do estado final. Replay: no fim da fita, confere se a
   * luta chegou ao mesmo estado da gravação.
   */
  private stepRecorded(inputs: readonly InputMask[]): void {
    const wasOver = this.state.phase === 'over';
    if (this.recording && !wasOver) recordInputs(this.recording, inputs);
    stepGame(this.state, inputs);
    if (this.recording && !wasOver && this.state.phase === 'over') {
      finishReplay(this.recording, this.state);
      this.recorded = true;
    }
    if (
      this.playback &&
      this.replayOk === null &&
      this.state.tick === replayLength(this.playback)
    ) {
      this.replayOk = replayMatches(this.playback, this.state);
      if (!this.replayOk) {
        console.warn('Replay: o estado final não bate com o gravado (outra versão das regras?).');
      }
    }
  }

  /** Efeitos do que aconteceu no tick (`state.events`). */
  private handleEvents(): void {
    for (const e of this.state.events) {
      switch (e.type) {
        case 'hit':
          this.onHit(e);
          break;
        case 'ko':
          this.onKo(e);
          break;
        case 'respawn':
          this.onRespawn(e.fighter);
          break;
        case 'action':
          this.onAction(e.fighter, e.action);
          break;
        case 'grab':
          playSfx(this, 'grab');
          break;
      }
    }
  }

  private onHit(e: HitEvent): void {
    const victim = this.state.fighters[e.victim];
    if (!victim) return;
    const kb = toPx(e.knockback);
    const strength = hitStrength(kb);
    spawnHitBurst(this.fx, {
      x: toPx(e.x),
      y: toPx(e.y),
      dirX: victim.kbx,
      dirY: victim.kby,
      strength,
      color: fighterColor(this.state.fighters, e.attacker),
    });
    this.shake.add(hitTrauma(kb));
    const sound = strength > 0.6 ? 'hit_heavy' : strength > 0.25 ? 'hit_medium' : 'hit_light';
    playSfx(this, sound, { volume: 0.85 + 0.25 * strength });
    if (e.kind === 'counter') playSfx(this, 'counter');
    this.flashUntil[e.victim] = this.state.tick + FLASH_TICKS + Math.round(3 * strength);
    if (!this.decisiveShown && isDecisiveHit(this.state, e.victim)) {
      this.decisiveShown = true;
      this.focus = e.victim;
      this.slowMo.trigger(DECISIVE_SLOWMO_MS, DECISIVE_SLOWMO_SCALE);
    }
  }

  /** KO: explosão na borda da tela por onde saiu (desenhada no HUD, sem zoom). */
  private onKo(e: KoEvent): void {
    const b = getStage(this.state.stageId).blastZone;
    const blast = { x: toPx(b.x), y: toPx(b.y), w: toPx(b.w), h: toPx(b.h) };
    const x = toPx(e.x);
    const y = toPx(e.y);
    const view = this.cameras.main.worldView;
    const at = koEdgePoint(
      { x: view.x, y: view.y, w: view.width, h: view.height },
      this.scale.width,
      this.scale.height,
      x,
      y,
      exitDirection(blast, x, y),
    );
    if (this.scene.isActive('hud')) {
      (this.scene.get('hud') as HudScene).koBurst(at, fighterColor(this.state.fighters, e.fighter));
    }
    this.shake.add(KO_TRAUMA);
    playSfx(this, 'ko');
    const f = this.state.fighters[e.fighter];
    if (f) playKoVoice(this, characterOfFighter(f));
    if (this.focus === e.fighter) this.focus = null;
    if (this.state.phase === 'over' && !this.decisiveShown) {
      this.decisiveShown = true;
      this.slowMo.trigger(FINAL_KO_SLOWMO_MS, FINAL_KO_SLOWMO_SCALE);
    }
  }

  private onRespawn(id: number): void {
    const f = this.state.fighters[id];
    if (!f) return;
    spawnRespawnGlow(
      this.fx,
      toPx(f.x + f.w / 2),
      toPx(f.y + f.h / 2),
      fighterColor(this.state.fighters, id),
    );
    playSfx(this, 'respawn');
  }

  /** Som, poeira e lufadas das ações do lutador. */
  private onAction(id: number, action: CueName): void {
    const f = this.state.fighters[id];
    if (!f) return;
    const feetX = toPx(f.x + f.w / 2);
    const feetY = toPx(f.y + f.h);
    switch (action) {
      case 'JUMP':
        playSfx(this, 'jump');
        spawnDust(this.backFx, feetX, feetY, 4);
        break;
      case 'LAND':
        playSfx(this, 'land');
        spawnDust(this.backFx, feetX, feetY, 6);
        break;
      case 'DASH':
        playSfx(this, 'dash');
        spawnDust(this.backFx, feetX, feetY, 3, f.facing === 1 ? -1 : 1);
        break;
      case 'SWING':
        playSfx(this, 'swing', { detune: f.move === 'special' ? -300 : 0 });
        break;
      case 'TAUNT': {
        const taunt = characterOfFighter(f).taunt;
        playVoice(this, taunt.sound, taunt.text);
        break;
      }
      case 'WALL_JUMP':
        playSfx(this, 'jump');
        spawnDust(
          this.backFx,
          feetX - f.facing * toPx(f.w / 2),
          toPx(f.y + f.h * 0.6),
          3,
          f.facing,
        );
        break;
      case 'AIR_JUMP':
        playSfx(this, 'air_jump');
        this.fx.spawn({
          texture: FX_TEXTURE.ring,
          x: feetX,
          y: feetY,
          life: 14,
          scale: 0.15,
          scaleEnd: 0.5,
          stretch: 1.6,
          alpha: 0.6,
        });
        break;
      case 'AIR_DODGE':
        playSfx(this, 'dodge');
        this.fx.spawn({
          texture: FX_TEXTURE.glow,
          x: feetX,
          y: toPx(f.y + f.h / 2),
          life: 12,
          scale: 2.4,
          scaleEnd: 1.2,
          alpha: 0.5,
          additive: true,
        });
        break;
      default:
        break;
    }
  }

  /** Rastro de fumaça (ou fogo) atrás de quem voa de um golpe forte. */
  private spawnTrails(): void {
    for (const f of this.state.fighters) {
      if (f.state !== 'hitstun' || f.hitstop > 0) continue;
      const kb = toPx(Math.hypot(f.kbx, f.kby));
      if (kb < TRAIL_MIN_KNOCKBACK) continue;
      const heat = Math.min((kb - TRAIL_MIN_KNOCKBACK) / 16, 1);
      const x = toPx(f.x + f.w / 2);
      const y = toPx(f.y + f.h / 2);
      const prev = this.prev[f.id] ?? f;
      // 2 por tick: o corpo anda muito entre um tick e outro
      spawnTrailPuff(this.backFx, x, y, heat);
      spawnTrailPuff(
        this.backFx,
        (x + toPx(prev.x + f.w / 2)) / 2,
        (y + toPx(prev.y + f.h / 2)) / 2,
        heat,
      );
    }
  }

  /** Posição do lutador em px, interpolada entre o tick anterior e o atual. */
  private renderRect(f: Fighter, alpha: number): Rect {
    const prev = this.prev[f.id] ?? f;
    let x = f.x;
    let y = f.y;
    if (Math.abs(f.x - prev.x) + Math.abs(f.y - prev.y) < TELEPORT_PX * SUBPX) {
      x = prev.x + (f.x - prev.x) * alpha;
      y = prev.y + (f.y - prev.y) * alpha;
    }
    return { x: toPx(x), y: toPx(y), w: toPx(f.w), h: toPx(f.h) };
  }

  private drawFighters(alpha: number): void {
    const g = this.overlayGfx;
    const d = this.debugGfx;
    const debug = this.registry.get(DEBUG_KEY) === true;
    g.clear();
    d.clear();
    if (debug) {
      // caixas de colisão do mapa
      d.lineStyle(2, STAGE_DEBUG_COLOR, 0.8);
      for (const s of getStage(this.state.stageId).solids) {
        d.strokeRect(toPx(s.x), toPx(s.y), toPx(s.w), toPx(s.h));
      }
    }
    for (const f of this.state.fighters) {
      const view = this.views[f.id];
      if (!view) continue;
      view.setVisible(f.state !== 'ko');
      if (f.state === 'ko') continue;
      const r = this.renderRect(f, alpha);
      // Desloca as caixas do sim para a posição interpolada.
      const dx = r.x - toPx(f.x);
      const dy = r.y - toPx(f.y);
      // Treme no congelamento do impacto.
      const shake =
        f.hitstop > 0 && f.state === 'hitstun' ? (this.state.tick % 2 === 0 ? 3 : -3) : 0;

      view.setPose(fighterPose(f), r.x + r.w / 2 + shake, r.y + r.h, f.facing, f.grounded);
      // invencível pisca; levando golpe, pisca claro
      view.setAlpha(f.invulnTicks > 0 && Math.floor(this.state.tick / 4) % 2 === 0 ? 0.35 : 1);
      if (this.state.tick < (this.flashUntil[f.id] ?? 0)) {
        view.setFlash();
      } else {
        const hurt = f.state === 'hitstun' && Math.floor(f.stateTicks / 3) % 2 === 0;
        view.setTint(hurt ? 0xffb0b0 : 0xffffff);
      }

      this.drawBlockOutlines(f, r);
      // marcador do jogador em cima da cabeça
      const player = fighterColor(this.state.fighters, f.id);
      const mx = r.x + r.w / 2;
      const my = r.y + r.h - view.height - 8;
      g.fillStyle(player, 1);
      g.lineStyle(2, 0x111111, 0.6);
      g.fillTriangle(mx - 9, my - 12, mx + 9, my - 12, mx, my);
      g.strokeTriangle(mx - 9, my - 12, mx + 9, my - 12, mx, my);

      if (!debug) continue;
      for (const box of activeHitboxes(f)) {
        const b = toRect(box, dx, dy);
        d.fillStyle(HITBOX_COLOR, 0.35);
        d.fillRect(b.x, b.y, b.w, b.h);
        d.lineStyle(2, HITBOX_COLOR, 1);
        d.strokeRect(b.x, b.y, b.w, b.h);
      }
      const h = toRect(hurtbox(f), dx, dy);
      d.lineStyle(2, f.invulnTicks > 0 ? HURTBOX_INVULN_COLOR : HURTBOX_COLOR, 1);
      d.strokeRect(h.x, h.y, h.w, h.h);
    }
  }

  /**
   * Blocos de especial que ainda não têm arte própria: contra-ataque (contorno
   * branco) e buff (contorno pulsando na cor secundária).
   */
  private drawBlockOutlines(f: Fighter, r: Rect): void {
    const g = this.overlayGfx;
    if (isCountering(f)) {
      g.lineStyle(4, 0xffffff, 0.9);
      g.strokeRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12);
    }
    if (f.buffTicks > 0) {
      const secondary = colorValue(characterOfFighter(f).colors.secondary);
      g.lineStyle(5, secondary, 0.35 + 0.25 * Math.sin(this.state.tick * 0.3));
      g.strokeRect(r.x - 7, r.y - 7, r.w + 14, r.h + 14);
    }
  }

  /** Efeitos do especial (fumaça, marca no chão, linhas de velocidade), a cada tick. */
  private spawnFx(): void {
    const t = this.state.tick;
    for (const f of this.state.fighters) {
      const view = this.views[f.id];
      const fx = CHARACTER_FX[f.character];
      const move = f.state === 'attack' && f.move === 'special' ? currentMove(f) : null;
      if (!view || !fx || !move) continue;
      const frame = moveFrame(f);
      const feetX = toPx(f.x + f.w / 2);
      const feetY = toPx(f.y + f.h);
      const w = toPx(f.w);
      const s = view.scale;

      if (frame <= move.startup) {
        if (frame === 1 && fx.chargeMark && f.grounded) {
          this.fx.spawn({
            texture: characterTextureKey(f.character),
            frame: fx.chargeMark,
            x: feetX - f.facing * w * 0.4,
            y: feetY,
            originX: f.facing === 1 ? 1 : 0,
            originY: 0.75,
            flipX: f.facing === -1,
            life: 70,
            scale: s * 0.7,
            alpha: 0.8,
          });
        }
        const puffs = fx.chargePuffs ?? [];
        if (puffs.length > 0 && t % 3 === 0) {
          this.fx.spawn({
            texture: characterTextureKey(f.character),
            frame: puffs[Math.floor(Math.random() * puffs.length)] ?? '',
            x: feetX - f.facing * (w / 2 + 6 + Math.random() * 10),
            y: feetY - 6 - Math.random() * 10,
            vx: -f.facing * (0.6 + Math.random() * 1.2),
            vy: -(0.3 + Math.random() * 0.6),
            life: 26,
            scale: s * 0.45,
            scaleEnd: s * 0.9,
            alpha: 0.95,
            flipX: f.facing === -1,
          });
        }
      } else if (isActiveFrame(move, frame)) {
        const streaks = fx.activeStreaks ?? [];
        if (streaks.length > 0 && t % 2 === 0) {
          this.fx.spawn({
            texture: characterTextureKey(f.character),
            frame: streaks[Math.floor(Math.random() * streaks.length)] ?? '',
            x: feetX - f.facing * (w / 2),
            y: feetY - toPx(f.h) * (0.25 + Math.random() * 0.5),
            originX: f.facing === 1 ? 1 : 0,
            vx: f.facing * 2,
            life: 10,
            scale: s * 0.55,
            alpha: 0.85,
            flipX: f.facing === -1,
          });
        }
      }
    }

    // fumacinha soltando dos projéteis
    for (const p of this.state.projectiles) {
      const owner = this.state.fighters.find((f) => f.id === p.owner);
      const puffs = owner ? CHARACTER_FX[owner.character]?.projectile?.puffs : undefined;
      const view = owner ? this.views[owner.id] : undefined;
      if (!owner || !puffs || !view || t % 5 !== 0) continue;
      const side = p.vx < 0 ? -1 : 1;
      this.fx.spawn({
        texture: characterTextureKey(owner.character),
        frame: puffs[Math.floor(Math.random() * puffs.length)] ?? '',
        x: toPx(p.x + p.w / 2) - side * toPx(p.w) * 0.6,
        y: toPx(p.y),
        vy: -0.5,
        life: 22,
        scale: view.scale * 0.35,
        scaleEnd: view.scale * 0.55,
        alpha: 0.9,
        flipX: side === -1,
      });
    }
  }

  /** Projétil com a arte de quem soltou (o frango), girando; elipse se não tiver arte. */
  private drawProjectiles(alpha: number): void {
    const g = this.overlayGfx;
    this.state.projectiles.forEach((p, i) => {
      const owner = this.state.fighters.find((f) => f.id === p.owner);
      const art = owner ? CHARACTER_FX[owner.character]?.projectile : undefined;
      const view = owner ? this.views[owner.id] : undefined;
      // interpola voltando a velocidade do último tick
      const x = toPx(p.x - p.vx * (1 - alpha));
      const y = toPx(p.y - p.vy * (1 - alpha));
      const w = toPx(p.w);
      const h = toPx(p.h);
      const side = p.vx < 0 ? -1 : p.vx > 0 ? 1 : p.facing;
      if (!owner || !art || !view) {
        drawEllipseProjectile(g, x, y, w, h);
        return;
      }
      const key = characterTextureKey(owner.character);
      const frame = art.frames[Math.floor(this.state.tick / 4) % art.frames.length] ?? '';
      let img = this.projectileImages[i];
      if (!img) {
        img = this.add.image(0, 0, key, frame).setDepth(DEPTH.projectiles);
        this.projectileImages[i] = img;
      }
      img.setTexture(key, frame).setVisible(true);
      img
        .setPosition(x + w / 2, y + h / 2)
        .setScale(view.scale * 0.85)
        .setFlipX(side === -1);
      if (art.trail) {
        let trail = this.projectileTrails[i];
        if (!trail) {
          trail = this.add.image(0, 0, key, art.trail).setDepth(DEPTH.projectiles - 1);
          this.projectileTrails[i] = trail;
        }
        trail
          .setTexture(key, art.trail)
          .setVisible(true)
          .setOrigin(side === 1 ? 1 : 0, 0.5)
          .setPosition(x + w / 2 - side * w * 0.45, y + h / 2)
          .setScale(view.scale * 0.6)
          .setFlipX(side === -1)
          .setAlpha(0.8);
      }
    });
    // esconde as imagens que sobraram (projéteis que sumiram)
    for (let i = this.state.projectiles.length; i < this.projectileImages.length; i++) {
      this.projectileImages[i]?.setVisible(false);
      this.projectileTrails[i]?.setVisible(false);
    }
  }

  /** Provocação: balão com o bordão (a voz sai do evento TAUNT). */
  private updateTaunts(alpha: number): void {
    for (const f of this.state.fighters) {
      const bubble = this.bubbles[f.id];
      if (!bubble) continue;
      const taunting = f.state === 'taunt';
      const c = characterOfFighter(f);
      if (taunting && this.lastStates[f.id] !== 'taunt') {
        bubble.setText(c.taunt.text);
      }
      this.lastStates[f.id] = f.state;
      bubble.setVisible(taunting);
      if (taunting) {
        const r = this.renderRect(f, alpha);
        const top = r.y + r.h - (this.views[f.id]?.height ?? r.h);
        bubble.setPosition(r.x + r.w / 2, top - 24);
      }
    }
  }

  private cameraTarget(alpha: number): { x: number; y: number; zoom: number } {
    const focused = this.focus !== null ? this.state.fighters[this.focus] : undefined;
    if (focused && focused.state !== 'ko') {
      return frameTargets(
        [this.renderRect(focused, alpha)],
        this.scale.width,
        this.scale.height,
        FOCUS_CAMERA,
      );
    }
    const rects = this.state.fighters
      .filter((f) => f.state !== 'ko')
      .map((f) => this.renderRect(f, alpha));
    return frameTargets(
      rects.length > 0 ? rects : [STAGE_VIEW],
      this.scale.width,
      this.scale.height,
    );
  }

  private updateCamera(alpha: number, delta: number): void {
    const cam = this.cameras.main;
    const target = this.cameraTarget(alpha);
    const rate = this.focus !== null ? FOCUS_CAMERA_RATE : CAMERA_RATE;
    const c = this.camPos;
    c.zoom = smooth(c.zoom, target.zoom, rate, delta);
    c.x = smooth(c.x, target.x, rate, delta);
    c.y = smooth(c.y, target.y, rate, delta);
    // o tremor vem em px de tela: divide pelo zoom para virar px de mundo
    const offset = this.shake.update(delta);
    const x = c.x + offset.x / c.zoom;
    const y = c.y + offset.y / c.zoom;
    cam.setZoom(c.zoom);
    cam.centerOn(x, y);
    this.stageView.update({
      x,
      y,
      zoom: c.zoom,
      width: this.scale.width,
      height: this.scale.height,
    });
  }
}

/** Projétil sem arte: elipse na cor secundária de quem soltou. */
function drawEllipseProjectile(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(x + w / 2, y + h / 2, w, h);
  g.lineStyle(2, 0x5a2d0c, 1);
  g.strokeEllipse(x + w / 2, y + h / 2, w, h);
}

/** Caixa do sim (subpx) em px de mundo, deslocada pela interpolação. */
function toRect(b: Box, dx: number, dy: number): Rect {
  return { x: toPx(b.x) + dx, y: toPx(b.y) + dy, w: toPx(b.w), h: toPx(b.h) };
}
