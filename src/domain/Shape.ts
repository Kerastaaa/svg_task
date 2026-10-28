import type { Group } from "./Group.js";

export abstract class Shape {
  private _parent: Group | null = null;

  constructor(public readonly id: string) {
    if (id.trim().length === 0) {
      throw new Error("shape id cannot be empty");
    }
  }

  abstract readonly kind: string;

  get parent(): Group | null {
    return this._parent;
  }

  setParent(parent: Group | null): void {
    this._parent = parent;
  }

  abstract move(dx: number, dy: number): void;

  abstract scale(factor: number): void;

  abstract getAttribute(name: string): string | undefined;

  abstract setAttribute(name: string, value: string | undefined): void;

  abstract toSvg(indent?: string): string;
}
