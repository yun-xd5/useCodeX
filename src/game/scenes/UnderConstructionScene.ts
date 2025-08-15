import type { Scene, SceneContext } from "../../engine/scene";
import { clear } from "../../lib/canvas";
import { Input } from "../../lib/input";
import { gameWidth, gameHeight } from "../../engine/layout";
import { drawHeader, HEADER_H } from "../../engine/ui";
import { MainMenuScene } from "./MainMenuScene";

export class UnderConstructionScene implements Scene {
  private input: Input;
  private ctx!: SceneContext;
  private prevPointerDown = false;
  constructor(input: Input) {
    this.input = input;
  }
  init(ctx: SceneContext): void {
    this.ctx = ctx;
    this.prevPointerDown = this.input.pointer.down;
  }
  update(): void {
    const justClicked = this.input.pointer.down && !this.prevPointerDown;
    const click = justClicked && this.input.pointer.x < gameWidth();
    const key = this.input.keys.has(" ") || this.input.keys.has("Enter") || this.input.keys.has("Escape");
    if (click || key) this.ctx.goto(new MainMenuScene(this.input));
    this.prevPointerDown = this.input.pointer.down;
  }
  render(ctx: CanvasRenderingContext2D): void {
    clear(ctx, "#0b0d12");
    const w = gameWidth();
    const h = gameHeight();
    // header with back
    const hdr = drawHeader(ctx, { leftLabel: "メニューへ" });
    ctx.save();
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "28px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    const title = "工事中";
    ctx.fillText(title, Math.floor((w - ctx.measureText(title).width) / 2), HEADER_H + 20);
    ctx.font = "16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    const msg = "クリック/Enter/Escでメインメニューへ";
    ctx.fillText(msg, Math.floor((w - ctx.measureText(msg).width) / 2), HEADER_H + 60);
    ctx.restore();
  }
}
