import type { Vec2 } from "./math";

export abstract class Entity {
  pos: Vec2;
  vel: Vec2;
  size: Vec2;

  constructor(pos: Vec2, size: Vec2) {
    this.pos = { ...pos };
    this.vel = { x: 0, y: 0 };
    this.size = { ...size };
  }

  /** Basic physics integration */
  integrate(dt: number): void {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
  }

  abstract update(dt: number, now: number): void;
  abstract render(ctx: CanvasRenderingContext2D): void;
}

