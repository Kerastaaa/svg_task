import { Shape } from "./Shape.js";
import { escapeSvg } from "./SvgText.js";

export class Group extends Shape {
  readonly kind = "g";
  private readonly children: Shape[] = [];

  get items(): readonly Shape[] {
    return this.children;
  }

  add(shape: Shape, index = this.children.length): void {
    if (shape === this || (shape instanceof Group && shape.contains(this.id))) {
      throw new Error("cannot create a cyclic shape tree");
    }

    if (!Number.isInteger(index) || index < 0 || index > this.children.length) {
      throw new Error(`invalid child index: ${index}`);
    }

    if (shape.parent) {
      shape.parent.remove(shape);
    }

    this.children.splice(index, 0, shape);
    shape.setParent(this);
  }

  remove(shape: Shape): number {
    const index = this.children.indexOf(shape);
    if (index < 0) throw new Error(`shape is not a child of ${this.id}`);
    this.children.splice(index, 1);
    shape.setParent(null);
    return index;
  }

  indexOf(shape: Shape): number {
    return this.children.indexOf(shape);
  }

  contains(id: string): boolean {
    return this.children.some((child) => child.id === id || child instanceof Group && child.contains(id));
  }

  findById(id: string): Shape | undefined {
    for (const child of this.children) {
      if (child.id === id) return child;
      if (child instanceof Group) {
        const match = child.findById(id);
        if (match) return match;
      }
    }
    return undefined;
  }

  move(dx: number, dy: number): void {
    for (const child of this.children) child.move(dx, dy);
  }

  scale(factor: number): void {
    for (const child of this.children) child.scale(factor);
  }

  setAttribute(name: string, value: string): void {
    throw new Error(`unknown group attribute: ${name}`);
  }

  toSvg(indent = ""): string {
    const inner = this.children.map((child) => child.toSvg(`${indent}  `)).join("\n");
    if (inner.length === 0) return `${indent}<g id="${escapeSvg(this.id)}"/>`;
    return `${indent}<g id="${escapeSvg(this.id)}">\n${inner}\n${indent}</g>`;
  }
}
