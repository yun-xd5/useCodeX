/**
 * Canvas ユーティリティ（DPR 対応のサイズ調整など）
 */

/**
 * ウィンドウ全体にキャンバスをリサイズし、デバイスピクセル比(DPR)を考慮した
 * スケーリングを適用します。描画座標は CSS ピクセル基準になります。
 *
 * @param canvas 対象のキャンバス要素
 * @param ctx 2D コンテキスト
 * @returns 現在の DPR
 */
// 実効的なビューポートサイズを取得（モバイルのアドレスバー縮み等に追随）
function viewportSize(): { width: number; height: number } {
  const vv = window.visualViewport;
  if (vv) {
    return { width: Math.floor(vv.width), height: Math.floor(vv.height) };
  }
  return { width: Math.floor(window.innerWidth), height: Math.floor(window.innerHeight) };
}

export function fitCanvasToWindow(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): number {
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const { width: cssWidth, height: cssHeight } = viewportSize();

  // 必要なときだけ実サイズ更新（毎回行うと描画がクリアされるため）
  const targetW = cssWidth * dpr;
  const targetH = cssHeight * dpr;
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
  }

  // CSS ピクセル座標系に合わせる
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return dpr;
}

/**
 * 2D コンテキストを作成し、滑らかさ等の初期設定を行います。
 */
export function createCtx2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) throw new Error("2D コンテキストが利用できません");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return ctx;
}

/**
 * 指定色で画面全体をクリアします。
 */
export function clear(ctx: CanvasRenderingContext2D, color = "#0b0d12"): void {
  const { width: w, height: h } = viewportSize();
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
