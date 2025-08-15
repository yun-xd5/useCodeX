import type { Scene, SceneContext } from "../../engine/scene";
import { MainMenuScene } from "./MainMenuScene";
import { Input } from "../../lib/input";
import { clear } from "../../lib/canvas";
import { gameWidth, gameHeight } from "../../engine/layout";

type VocabItem = { jp: string; en: string };

type Option = {
  key: string;
  label: string;
  path: string; // 公開ディレクトリ(public/)配下の JSON へのパス
  rect: { x: number; y: number; w: number; h: number };
};

export class LevelSelectScene implements Scene {
  private input: Input;
  private ctx!: SceneContext;
  private options: Option[] = [];
  private backRect: { x: number; y: number; w: number; h: number } | null = null;
  private loading: string | null = null; // path when loading
  private error: string | null = null;
  private prevPointerDown = false;
  private clickCooldown = 0; // seconds to absorb initial click

  constructor(input: Input) {
    this.input = input;
  }

  init(ctx: SceneContext): void {
    this.ctx = ctx;
    this.layout();
    this.prevPointerDown = this.input.pointer.down;
    this.clickCooldown = 0.15;
  }

  private layout(): void {
    const w = gameWidth();
    const h = gameHeight();
    const bw = Math.min(420, Math.floor(w * 0.8));
    const bh = 64;
    const cx = Math.floor((w - bw) / 2);
    const startY = Math.floor(h / 2) - (bh * 2 + 16 * 1.5); // four buttons centered roughly
    const gap = 16;
    // 注意: GitHub Pages（プロジェクトサイト）の場合は配信パスが '/<repo>/' になる
    // Vite の base 設定は import.meta.env.BASE_URL に入るため、それを先頭に付与して
    // どの環境（ローカル/Pages）でも正しいパスに解決されるようにする
    const base = import.meta.env.BASE_URL; // 末尾にスラッシュが付いている想定
    const items = [
      { key: "1", label: "英検3級", path: `${base}data/eiken3.json` },
      { key: "2", label: "英検準2級", path: `${base}data/eiken_pre2.json` },
      { key: "3", label: "英検2級", path: `${base}data/eiken2.json` },
      { key: "4", label: "英検準1級", path: `${base}data/eiken_pre1.json` },
    ];
    this.options = items.map((it, i) => ({
      key: it.key,
      label: it.label,
      path: it.path,
      rect: { x: cx, y: startY + i * (bh + gap), w: bw, h: bh },
    }));
    // back button (to Main Menu)
    const bw2 = 180;
    const bh2 = 44;
    this.backRect = { x: 24, y: h - bh2 - 24, w: bw2, h: bh2 };
  }

  private isInside(x: number, y: number, r: { x: number; y: number; w: number; h: number }): boolean {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  async choose(opt: Option): Promise<void> {
    try {
      this.loading = opt.label;
      this.error = null;
      const res = await fetch(opt.path, { cache: "no-cache" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as VocabItem[];
      const { VocabScene } = await import("./VocabScene");
      this.ctx.goto(new VocabScene(this.input, data));
    } catch (e: any) {
      this.error = e?.message ?? String(e);
      this.loading = null;
    }
  }

  update(_dt: number, _now: number): void {
    this.clickCooldown = Math.max(0, this.clickCooldown - _dt);

    // block input while loading
    if (this.loading) {
      this.prevPointerDown = this.input.pointer.down;
      return;
    }

    // click select (edge-trigger)
    const justClicked = this.input.pointer.down && !this.prevPointerDown;
    if (justClicked && this.clickCooldown <= 0 && this.input.pointer.x < gameWidth()) {
      for (const o of this.options) {
        if (this.isInside(this.input.pointer.x, this.input.pointer.y, o.rect)) {
          // fire-and-forget async; no await in update
          this.choose(o);
          break;
        }
      }
      if (this.backRect && this.isInside(this.input.pointer.x, this.input.pointer.y, this.backRect)) {
        this.ctx.goto(new MainMenuScene(this.input));
        return;
      }
    }
    // keyboard shortcuts 1-4
    if (!this.loading) {
      if (this.input.keys.has("1")) this.choose(this.options[0]);
      if (this.input.keys.has("2")) this.choose(this.options[1]);
      if (this.input.keys.has("3")) this.choose(this.options[2]);
      if (this.input.keys.has("4")) this.choose(this.options[3]);
    }
    if (this.input.keys.has("Escape") || this.input.keys.has("m") || this.input.keys.has("M")) this.ctx.goto(new MainMenuScene(this.input));

    this.prevPointerDown = this.input.pointer.down;
  }

  render(ctx: CanvasRenderingContext2D): void {
    clear(ctx, "#0b0d12");
    const w = gameWidth();
    const h = gameHeight();

    // Title
    ctx.save();
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "28px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    const title = "レベル選択";
    ctx.fillText(title, Math.floor(w / 2 - ctx.measureText(title).width / 2), 80);
    ctx.restore();

    // How to play
    ctx.save();
    ctx.fillStyle = "#9fb3d9";
    ctx.font = "16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    const lines = [
      "遊び方:",
      "・日本語のヒントに合う英単語をクリック/タップで選択",
      "・判定後は クリック/Space/Enter で次の問題へ",
      "・Escでメインメニューに戻る / Rでリスタート",
    ];
    let ly = 120;
    for (const ln of lines) {
      ctx.fillText(ln, 24, ly);
      ly += 20;
    }
    ctx.restore();

    // Buttons
    ctx.save();
    ctx.font = "20px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    for (const o of this.options) {
      ctx.fillStyle = "#1a2333";
      ctx.strokeStyle = "#2e6bff";
      ctx.lineWidth = 2;
      ctx.fillRect(o.rect.x, o.rect.y, o.rect.w, o.rect.h);
      ctx.strokeRect(o.rect.x + 0.5, o.rect.y + 0.5, o.rect.w - 1, o.rect.h - 1);
      const label = `${o.label}  (キー ${o.key})`;
      const tm = ctx.measureText(label);
      ctx.fillStyle = "#e6e6e6";
      ctx.fillText(label, Math.floor(o.rect.x + (o.rect.w - tm.width) / 2), Math.floor(o.rect.y + o.rect.h / 2));
    }
    ctx.restore();

    // Back button
    if (this.backRect) {
      const r = this.backRect;
      ctx.save();
      ctx.fillStyle = "#1a2333";
      ctx.strokeStyle = "#2e6bff";
      ctx.lineWidth = 2;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      const cap = "メインメニューへ (Esc/M)";
      ctx.fillStyle = "#e6e6e6";
      ctx.font = "16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      const tm = ctx.measureText(cap);
      ctx.fillText(cap, Math.floor(r.x + (r.w - tm.width) / 2), Math.floor(r.y + r.h / 2 - 6));
      ctx.restore();
    }

    // Loading / error
    if (this.loading) {
      ctx.save();
      ctx.fillStyle = "#e6e6e6";
      ctx.font = "16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      const text = `読み込み中: ${this.loading}...`;
      ctx.fillText(text, 20, h - 40);
      ctx.restore();
    } else if (this.error) {
      ctx.save();
      ctx.fillStyle = "#ff7a7a";
      ctx.font = "16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      const text = `エラー: ${this.error}`;
      ctx.fillText(text, 20, h - 40);
      ctx.restore();
    }
  }
}
