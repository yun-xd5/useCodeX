import { clear } from "../../lib/canvas";
import { Input } from "../../lib/input";
import { clamp } from "../../engine/math";
import type { Scene, SceneContext } from "../../engine/scene";
import { DEBUG_PANEL_W, gameWidth, gameHeight } from "../../engine/layout";
import { drawHeader, HEADER_H } from "../../engine/ui";
import { LevelSelectScene } from "./LevelSelectScene";
import { MainMenuScene } from "./MainMenuScene";

type Choice = {
  text: string;
  rect: { x: number; y: number; w: number; h: number };
  correct: boolean;
};

class Player {
  input: Input;
  pos: { x: number; y: number } = { x: 0, y: 0 };
  vel: { x: number; y: number } = { x: 0, y: 0 };
  size: { x: number; y: number } = { x: 24, y: 24 };
  constructor(input: Input) {
    this.input = input;
  }
  update(dt: number): void {
    const speed = 180;
    this.vel.x = 0;
    this.vel.y = 0;
    if (this.input.keys.has("ArrowLeft") || this.input.keys.has("a")) this.vel.x -= speed;
    if (this.input.keys.has("ArrowRight") || this.input.keys.has("d")) this.vel.x += speed;
    if (this.input.keys.has("ArrowUp") || this.input.keys.has("w")) this.vel.y -= speed;
    if (this.input.keys.has("ArrowDown") || this.input.keys.has("s")) this.vel.y += speed;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
  }
  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#4cff85";
    ctx.fillRect(this.pos.x - this.size.x / 2, this.pos.y - this.size.y / 2, this.size.x, this.size.y);
  }
}

function shuffle<T>(arr: T[], rng = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rectsIntersect(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

type VocabItem = { jp: string; en: string };

export class VocabScene implements Scene {
  private input: Input;
  private player: Player;
  private questions: VocabItem[] = [];
  private index = 0;
  private choices: Choice[] = [];
  private score = 0;
  private lives = 3;
  private locked = false;
  private lastResult: "correct" | "wrong" | null = null;
  private messageTimer = 0;
  private prevPointerDown = false;
  private feedbackChoice: Choice | null = null;
  private quitRect: { x: number; y: number; w: number; h: number } | null = null;

  private static readonly FEEDBACK_DURATION = 0.9; // seconds
  private pool: VocabItem[];
  private ctxRef?: SceneContext;
  private entryClickCooldown = 0; // seconds to absorb entering click

  constructor(input: Input, items: VocabItem[]) {
    this.input = input;
    this.player = new Player(this.input);
    this.pool = items;
  }

  init(ctx?: SceneContext): void {
    this.ctxRef = ctx;
    this.questions = shuffle(this.pool).slice(0, 12);
    this.index = 0;
    this.score = 0;
    this.lives = 3;
    this.locked = false;
    this.lastResult = null;
    this.messageTimer = 0;
    this.player.pos = { x: gameWidth() / 2, y: gameHeight() - 60 };
    this.setupChoices();
    // absorb click from previous scene
    this.prevPointerDown = this.input.pointer.down;
    this.entryClickCooldown = 0.15;
  }

  private setupChoices(): void {
    const current = this.questions[this.index];
    if (!current) return;
    const distractors = shuffle(
      this.pool.filter((v) => v.en !== current.en).map((v) => v.en)
    ).slice(0, 3);
    const texts = shuffle([current.en, ...distractors]);

    const margin = 40;
    const gw = gameWidth();
    const gh = gameHeight();
    const boxW = Math.min(360, Math.floor(gw / 2) - margin * 1.5);
    const boxH = 80;
    const topY = HEADER_H + margin;
    const positions = [
      { x: margin, y: topY },
      { x: gw - margin - boxW, y: topY },
      { x: margin, y: gh - margin - boxH },
      { x: gw - margin - boxW, y: gh - margin - boxH },
    ];

    this.choices = texts.map((t, i) => ({
      text: t,
      rect: { x: positions[i].x, y: positions[i].y, w: boxW, h: boxH },
      correct: t === current.en,
    }));
  }

  private currentPrompt(): string {
    const q = this.questions[this.index];
    return q ? `Q${this.index + 1}: 「${q.jp}」に合う英単語は？` : "";
  }

  private playerAABB() {
    return {
      x: this.player.pos.x - this.player.size.x / 2,
      y: this.player.pos.y - this.player.size.y / 2,
      w: this.player.size.x,
      h: this.player.size.y,
    };
  }

  private next(): void {
    this.index++;
    this.locked = false;
    this.lastResult = null;
    if (this.index >= this.questions.length || this.lives <= 0) return;
    this.setupChoices();
  }

  private handleChoice(c: Choice): void {
    this.locked = true;
    if (c.correct) {
      this.score += 1;
      this.lastResult = "correct";
    } else {
      this.lives -= 1;
      this.lastResult = "wrong";
    }
    this.feedbackChoice = c;
    this.messageTimer = VocabScene.FEEDBACK_DURATION; // seconds
  }

  update(dt: number, _now: number): void {
    const done = this.index >= this.questions.length || this.lives <= 0;
    // End screen interactions
    if (done) {
      const justClicked = this.input.pointer.down && !this.prevPointerDown;
      const clickInGame = justClicked && this.input.pointer.x < gameWidth();
      const backKey = this.input.keys.has(" ") || this.input.keys.has("Space") || this.input.keys.has("Enter") || this.input.keys.has("Escape");
      if (this.input.keys.has("r")) {
        this.init(this.ctxRef);
      } else if (clickInGame || backKey) {
        if (this.ctxRef) this.ctxRef.goto(new LevelSelectScene(this.input));
      }
      this.prevPointerDown = this.input.pointer.down;
      return;
    }

    // Common edge-click detection for in-play UI
    const justClicked = this.input.pointer.down && !this.prevPointerDown;
    if (justClicked && this.input.pointer.x < gameWidth()) {
      // Quit button
      if (this.quitRect) {
        const p = this.input.pointer;
        const r = this.quitRect;
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
          if (this.ctxRef) this.ctxRef.goto(new LevelSelectScene(this.input));
          this.prevPointerDown = this.input.pointer.down;
          return;
        }
      }
    }

    // player-based selection disabled; use click/tap only

    if (this.locked) {
      // keep feedback anim running but wait for user to proceed
      this.messageTimer = Math.max(0, this.messageTimer - dt);
      const justClicked = this.input.pointer.down && !this.prevPointerDown;
      const clickInGame = justClicked && this.input.pointer.x < gameWidth();
      const advanceKey =
        this.input.keys.has(" ") || // Space (some browsers report ' ')
        this.input.keys.has("Space") ||
        this.input.keys.has("Enter");
      if (clickInGame || advanceKey) {
        this.next();
      }
      // direct back to game menu/MainMenu shortcuts
      if (this.input.keys.has("Escape") || this.input.keys.has("g") || this.input.keys.has("G")) {
        if (this.ctxRef) this.ctxRef.goto(new LevelSelectScene(this.input));
      }
      if (this.input.keys.has("m") || this.input.keys.has("M")) {
        if (this.ctxRef) this.ctxRef.goto(new MainMenuScene(this.input));
      }
      this.prevPointerDown = this.input.pointer.down;
      return;
    }

    // Global shortcuts while playing
    if (this.input.keys.has("Escape") || this.input.keys.has("g") || this.input.keys.has("G")) {
      if (this.ctxRef) this.ctxRef.goto(new LevelSelectScene(this.input));
      return;
    }
    if (this.input.keys.has("m") || this.input.keys.has("M")) {
      if (this.ctxRef) this.ctxRef.goto(new MainMenuScene(this.input));
      return;
    }

    // click/tap on choice (edge trigger on pointer down)
    // drain initial cooldown
    this.entryClickCooldown = Math.max(0, this.entryClickCooldown - dt);
    if (justClicked && this.entryClickCooldown <= 0 && this.input.pointer.x < gameWidth()) {
      for (const c of this.choices) {
        const p = this.input.pointer;
        if (
          p.x >= c.rect.x &&
          p.x <= c.rect.x + c.rect.w &&
          p.y >= c.rect.y &&
          p.y <= c.rect.y + c.rect.h
        ) {
          this.handleChoice(c);
          break;
        }
      }
    }

    // collision selection disabled (player hidden)

    // remember pointer state for edge detection
    this.prevPointerDown = this.input.pointer.down;
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // top bar over game viewport only
    const gw = gameWidth();
    const hdr = drawHeader(ctx, { leftLabel: "やめる" });
    this.quitRect = hdr.leftRect;

    // Prompt text inside header, avoiding overlap with quit button and right-side score
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "20px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    ctx.textBaseline = "middle";
    const prompt = this.currentPrompt();
    const leftX = Math.max(16, (this.quitRect ? this.quitRect.x + this.quitRect.w + 16 : 16));

    // score & lives
    const rightText = `スコア: ${this.score}   ライフ: ${"❤".repeat(this.lives)}${"·".repeat(Math.max(0, 3 - this.lives))}`;
    const metrics = ctx.measureText(rightText);
    const rightTextX = gw - metrics.width - 16;
    ctx.fillText(rightText, rightTextX, 50);

    // Ellipsize prompt if it would collide with right text
    const maxPromptW = Math.max(0, rightTextX - leftX - 8);
    let disp = prompt;
    if (ctx.measureText(disp).width > maxPromptW) {
      while (disp.length > 1 && ctx.measureText(disp + "…").width > maxPromptW) {
        disp = disp.slice(0, -1);
      }
      disp = disp + "…";
    }
    ctx.fillText(disp, leftX, 50);

    // result flash
    if (this.lastResult) {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = this.lastResult === "correct" ? "#194d2e" : "#5a1f1f";
      ctx.fillRect(0, 100, gw, 6);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  private drawChoices(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.font = "24px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    for (const c of this.choices) {
      // box
      ctx.fillStyle = "#1a2333";
      ctx.strokeStyle = "#2e6bff";
      ctx.lineWidth = 2;
      ctx.fillRect(c.rect.x, c.rect.y, c.rect.w, c.rect.h);
      ctx.strokeRect(c.rect.x + 0.5, c.rect.y + 0.5, c.rect.w - 1, c.rect.h - 1);

      // text centered
      ctx.fillStyle = "#e6e6e6";
      ctx.textBaseline = "middle";
      const text = c.text;
      const tm = ctx.measureText(text);
      const tx = c.rect.x + (c.rect.w - tm.width) / 2;
      const ty = c.rect.y + c.rect.h / 2;
      ctx.fillText(text, Math.floor(tx), Math.floor(ty));
    }

    // feedback highlight for selected choice
    if (this.locked && this.feedbackChoice && this.lastResult) {
      const t = 1 - Math.max(0, this.messageTimer) / VocabScene.FEEDBACK_DURATION; // 0→1
      const alpha = 0.6 * (1 - t);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.lastResult === "correct" ? "#1f7a46" : "#7a1f1f";
      const r = this.feedbackChoice.rect;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
      // border pulse
      ctx.strokeStyle = this.lastResult === "correct" ? "#4cff85" : "#ff7a7a";
      ctx.lineWidth = 2 + 4 * (1 - t);
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    }

    // additionally, when wrong, emphasize the correct choice
    if (this.locked && this.lastResult === "wrong") {
      const correct = this.choices.find((c) => c.correct);
      if (correct) {
        const t = 1 - Math.max(0, this.messageTimer) / VocabScene.FEEDBACK_DURATION; // 0→1
        const glow = 6 * (1 - t);
        const r = correct.rect;
        // subtle green overlay
        ctx.globalAlpha = 0.35 * (1 - t);
        ctx.fillStyle = "#1f7a46";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.globalAlpha = 1;
        // glowing border
        ctx.strokeStyle = "#4cff85";
        for (let i = 0; i < 3; i++) {
          ctx.globalAlpha = 0.2 + 0.2 * (2 - i);
          ctx.lineWidth = 2 + glow + i * 2;
          ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        }
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  private drawGameOver(ctx: CanvasRenderingContext2D): void {
    const done = this.index >= this.questions.length || this.lives <= 0;
    if (!done) return;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, gameWidth(), gameHeight());
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "28px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    ctx.textBaseline = "top";
    const title = this.lives > 0 ? "クリア！" : "ゲームオーバー";
    const result = `スコア: ${this.score} / ${this.questions.length}`;
    const guide = "クリックでゲームメニューへ / Rでリスタート / Mでメイン";
    ctx.fillText(title, 40, 120);
    ctx.fillText(result, 40, 160);
    ctx.fillText(guide, 40, 200);
    ctx.restore();
  }

  render(ctx: CanvasRenderingContext2D, _now: number, _dt: number): void {
    clear(ctx, "#0b0d12");
    this.drawHUD(ctx);

    // screen shake for wrong answers during feedback
    ctx.save();
    if (this.locked && this.lastResult === "wrong") {
      const k = Math.max(0, this.messageTimer) / VocabScene.FEEDBACK_DURATION; // 1→0
      const amp = 6 * k;
      const ox = (Math.random() * 2 - 1) * amp;
      const oy = (Math.random() * 2 - 1) * amp;
      ctx.translate(Math.floor(ox), Math.floor(oy));
    }

    this.drawChoices(ctx);
    ctx.restore();

    // center feedback text + proceed hint
    if (this.locked && this.lastResult) {
      const t = 1 - Math.max(0, this.messageTimer) / VocabScene.FEEDBACK_DURATION; // 0→1
      const text = this.lastResult === "correct" ? "正解！" : "不正解";
      ctx.save();
      ctx.font = "36px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      const tm = ctx.measureText(text);
      const x = Math.floor((gameWidth() - tm.width) / 2);
      const y = Math.floor(HEADER_H + 20);
      // fade + slight pop
      const alpha = 1 - t * 0.6;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.lastResult === "correct" ? "#4cff85" : "#ff7a7a";
      ctx.fillText(text, x, y);
      // proceed hint
      ctx.font = "16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      const hint = "クリックまたはSpaceで次へ";
      const hm = ctx.measureText(hint);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#e6e6e6";
      ctx.fillText(hint, Math.floor((gameWidth() - hm.width) / 2), y + 36 + 12);
      ctx.restore();
    }
    this.drawGameOver(ctx);
  }
}
