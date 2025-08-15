// アプリケーションのエントリポイント
// - Canvas のセットアップ（DPR 対応リサイズ）
// - 入力処理（ポインタ/キーボード）
// - 描画ループ（FPS 計測）

import { createCtx2D, fitCanvasToWindow, clear } from "./lib/canvas";
import { createLoop } from "./lib/loop";
import { Input } from "./lib/input";

const canvas = document.getElementById("app") as HTMLCanvasElement | null;
if (!canvas) throw new Error("canvas#app が見つかりません");

const ctx = createCtx2D(canvas);
const input = new Input(canvas);

// 初期リサイズ & ウィンドウサイズ変化で更新
let dpr = fitCanvasToWindow(canvas, ctx);
window.addEventListener("resize", () => {
  dpr = fitCanvasToWindow(canvas, ctx);
});

// デモ用の状態
const state = {
  angle: 0,
  speed: Math.PI / 2, // 角速度(rad/s)
  time: 0,
};

// 更新処理
function update(dt: number, now: number): void {
  state.time = now / 1000;

  // 簡単な操作: 上下キーで速度を調整
  if (input.keys.has("ArrowUp")) state.speed += 0.5 * dt;
  if (input.keys.has("ArrowDown")) state.speed -= 0.5 * dt;
  state.speed = Math.max(0, Math.min(4, state.speed));

  state.angle += state.speed * dt;
}

// オーバーレイ（FPS 等）描画
function renderOverlay(ctx: CanvasRenderingContext2D, fps: number): void {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  ctx.textBaseline = "top";

  const lines = [
    `FPS: ${fps.toFixed(1)}`,
    `Speed: ${state.speed.toFixed(2)} rad/s`,
    `Pointer: ${Math.round(input.pointer.x)}, ${Math.round(input.pointer.y)} ${
      input.pointer.down ? "(down)" : ""
    }`,
    `DPR: ${dpr}`,
    `Keys: ${[...input.keys].join(", ")}`,
  ];

  let y = 8;
  for (const line of lines) {
    // 影
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillText(line, 9, y + 1);
    ctx.fillStyle = "#e6e6e6";
    ctx.fillText(line, 8, y);
    y += 16;
  }
  ctx.restore();
}

// 描画処理
function render(
  ctx: CanvasRenderingContext2D,
  _now: number,
  _dt: number,
  { fps }: { fps: number }
): void {
  clear(ctx, "#0b0d12");

  const w = Math.floor(window.innerWidth);
  const h = Math.floor(window.innerHeight);

  // 中心で回転する四角形
  const size = Math.min(w, h) * 0.12;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(state.angle);

  // ベースの四角形
  ctx.fillStyle = "#2e6bff";
  ctx.fillRect(-size / 2, -size / 2, size, size);

  // 十字のライン
  ctx.strokeStyle = "#9cc1ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-size / 2, 0);
  ctx.lineTo(size / 2, 0);
  ctx.moveTo(0, -size / 2);
  ctx.lineTo(0, size / 2);
  ctx.stroke();
  ctx.restore();

  // ポインタ表示
  ctx.save();
  ctx.strokeStyle = input.pointer.down ? "#ff7a7a" : "#4cff85";
  ctx.beginPath();
  ctx.arc(input.pointer.x, input.pointer.y, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  renderOverlay(ctx, fps);
}

// タブ非表示時は省電力のため停止
const loop = createLoop({ update, render, ctx });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) loop.stop();
  else {
    fitCanvasToWindow(canvas, ctx);
    loop.start();
  }
});

// 開始
loop.start();

