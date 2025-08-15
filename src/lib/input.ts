/**
 * ポインタ（マウス/タッチ/ペン）とキーボード入力のヘルパ
 */

export type PointerState = {
  x: number;
  y: number;
  down: boolean;
  buttons: Set<number>;
  inside: boolean;
};

export class Input {
  /** 対象キャンバス */
  public canvas: HTMLCanvasElement;
  /** ポインタ状態 */
  public pointer: PointerState;
  /** 押下中のキー集合（KeyboardEvent.key） */
  public keys: Set<string>;
  /** ホイール累積量 */
  public wheel: { x: number; y: number };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.pointer = { x: 0, y: 0, down: false, buttons: new Set(), inside: false };
    this.keys = new Set();
    this.wheel = { x: 0, y: 0 };

    // バインド
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onPointerLeave = this._onPointerLeave.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    // イベント登録
    canvas.addEventListener("pointermove", this._onPointerMove);
    canvas.addEventListener("pointerdown", this._onPointerDown);
    window.addEventListener("pointerup", this._onPointerUp);
    canvas.addEventListener("pointerleave", this._onPointerLeave);
    canvas.addEventListener("wheel", this._onWheel, { passive: true });
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  /** リスナ解除 */
  dispose(): void {
    const c = this.canvas;
    c.removeEventListener("pointermove", this._onPointerMove);
    c.removeEventListener("pointerdown", this._onPointerDown);
    window.removeEventListener("pointerup", this._onPointerUp);
    c.removeEventListener("pointerleave", this._onPointerLeave);
    c.removeEventListener("wheel", this._onWheel as EventListener);
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }

  /** ポインタ移動 */
  private _onPointerMove(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = e.clientX - rect.left;
    this.pointer.y = e.clientY - rect.top;
    this.pointer.inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
  }

  /** ポインタ押下 */
  private _onPointerDown(e: PointerEvent): void {
    this.canvas.setPointerCapture?.(e.pointerId);
    this.pointer.down = true;
    this.pointer.buttons.add(e.button);
    this._onPointerMove(e);
  }

  /** ポインタ解放 */
  private _onPointerUp(e: PointerEvent): void {
    this.pointer.buttons.delete(e.button);
    this.pointer.down = this.pointer.buttons.size > 0;
  }

  /** ポインタがキャンバス外へ */
  private _onPointerLeave(_e: PointerEvent): void {
    this.pointer.inside = false;
  }

  /** ホイール */
  private _onWheel(e: WheelEvent): void {
    this.wheel.x += e.deltaX;
    this.wheel.y += e.deltaY;
  }

  /** キー押下 */
  private _onKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.key);
  }

  /** キー解放 */
  private _onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key);
  }
}

