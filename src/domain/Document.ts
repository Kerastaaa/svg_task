import { Group } from "./Group.js";
import { Shape } from "./Shape.js";

export class DocumentModel {
  readonly root = new Group("__root__");

  constructor(public width = 800, public height = 600) {
    this.resize(width, height);
  }

  resize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error("canvas dimensions must be positive numbers");
    }
    this.width = width;
    this.height = height;
  }

  add(shape: Shape, parentId?: string): void {
    const parent = parentId === undefined ? this.root : this.findById(parentId);
    if (!parent) throw new Error(`no such container: ${parentId}`);
    if (!(parent instanceof Group)) throw new Error(`not a container: ${parentId}`);

    const incomingIds = new Set<string>();
    for (const descendant of this.walk(shape)) {
      if (incomingIds.has(descendant.id) || this.hasId(descendant.id)) {
        throw new Error(`id already exists: ${descendant.id}`);
      }
      incomingIds.add(descendant.id);
    }

    parent.add(shape);
  }

  remove(id: string): { shape: Shape; parent: Group; index: number } {
    const shape = this.findById(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    const parent = shape.parent;
    if (!parent) throw new Error(`shape has no parent: ${id}`);
    const index = parent.remove(shape);
    return { shape, parent, index };
  }

  findById(id: string): Shape | undefined {
    return this.root.findById(id);
  }

  hasId(id: string): boolean {
    return this.findById(id) !== undefined;
  }

  private *walk(shape: Shape): Iterable<Shape> {
    yield shape;
    if (shape instanceof Group) {
      for (const child of shape.items) yield* this.walk(child);
    }
  }
}
