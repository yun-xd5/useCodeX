import { clear } from "../../lib/canvas";
import { Input } from "../../lib/input";
import { Camera2D } from "../../engine/camera";
import { Entity } from "../../engine/entity";
import { clamp, vec } from "../../engine/math";
import type { Scene } from "../../engine/scene";

class Player extends Entity {
  input: Input;

  constructor(input: Input) {
    super(vec(0, 0), vec(24, 24));
    this.input = input;
  }

  update(dt: number, _now: number): void {
    const speed = 140; // px/s
    this.vel.x = 0;
    this.vel.y = 0;
    if (this.input.keys.has("ArrowLeft") || this.input.keys.has("a")) this.vel.x -= speed;
    if (this.input.keys.has("ArrowRight") || this.input.keys.has("d")) this.vel.x += speed;
    if (this.input.keys.has("ArrowUp") || this.input.keys.has("w")) this.vel.y -= speed;
    if (this.input.keys.has("ArrowDown") || this.input.keys.has("s")) this.vel.y += speed;

    this.integrate(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#4cff85";
    ctx.fillRect(this.pos.x - this.size.x / 2, this.pos.y - this.size.y / 2, this.size.x, this.size.y);
  }
}

export class GameScene implements Scene {
  private input: Input;
  private camera = new Camera2D();
  private player: Player;
  private world = { w: 800, h: 600 };

  constructor(input: Input) {
    this.input = input;
    this.player = new Player(this.input);
    this.player.pos = vec(100, 100);
  }

  init(): void {
    // no-op for now
  }

  update(dt: number, _now: number): void {
    // Zoom with wheel
    if (this.input.wheel.y !== 0) {
      const delta = -this.input.wheel.y * 0.001;
      this.camera.zoom = clamp(this.camera.zoom + delta, 0.5, 3);
      this.input.wheel.y = 0;
    }

    this.player.update(dt, _now);

    // keep player in world bounds
    this.player.pos.x = clamp(this.player.pos.x, this.player.size.x / 2, this.world.w - this.player.size.x / 2);
    this.player.pos.y = clamp(this.player.pos.y, this.player.size.y / 2, this.world.h - this.player.size.y / 2);

    // camera follows player with slight lag
    const pad = 0; // keeping simple; could add smoothing
    this.camera.position.x = clamp(this.player.pos.x - window.innerWidth / 2 / this.camera.zoom + pad, 0, Math.max(0, this.world.w - window.innerWidth / this.camera.zoom));
    this.camera.position.y = clamp(this.player.pos.y - window.innerHeight / 2 / this.camera.zoom + pad, 0, Math.max(0, this.world.h - window.innerHeight / this.camera.zoom));
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const step = 50;
    ctx.save();
    ctx.strokeStyle = "#1a2333";
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.world.w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.world.h);
      ctx.stroke();
    }
    for (let y = 0; y <= this.world.h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.world.w, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  render(ctx: CanvasRenderingContext2D, _now: number, _dt: number): void {
    clear(ctx, "#0b0d12");
    // world space
    this.camera.begin(ctx);
    // world bounds
    ctx.fillStyle = "#0f1420";
    ctx.fillRect(0, 0, this.world.w, this.world.h);

    this.drawGrid(ctx);
    this.player.render(ctx);

    // simple obstacles
    ctx.fillStyle = "#2e6bff";
    ctx.fillRect(300, 120, 80, 40);
    ctx.fillRect(520, 260, 40, 120);

    this.camera.end(ctx);
  }
}
