import type { Command } from "./Command.js";
import type { DocumentModel } from "../domain/Document.js";
import { Group } from "../domain/Group.js";
import type { Shape } from "../domain/Shape.js";

export class UngroupCommand implements Command {
  private group: Group | undefined;
  private parent: Group | undefined;
  private index: number | undefined;
  private children: Shape[] | undefined;

  constructor(private readonly document: DocumentModel, private readonly id: string) {}

  execute(): string {
    if (!this.group) this.captureAndValidate();
    if (!this.group || !this.parent || this.index === undefined || !this.children) {
      throw new Error("ungroup command is not initialized");
    }

    this.parent.remove(this.group);
    this.children.forEach((child, offset) => this.parent?.add(child, this.index! + offset));
    return `g#${this.group.id} ungrouped`;
  }

  undo(): string {
    if (!this.group || !this.parent || this.index === undefined || !this.children) {
      throw new Error("ungroup command was not executed");
    }
    for (const child of this.children) this.parent.remove(child);
    for (const child of this.children) this.group.add(child);
    this.parent.add(this.group, this.index);
    return `g#${this.group.id} ungroup restored`;
  }

  private captureAndValidate(): void {
    const shape = this.document.findById(this.id);
    if (!shape) throw new Error(`no such shape: ${this.id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${this.id}`);
    if (shape.parent === this.document.root) throw new Error(`cannot ungroup top-level container: ${this.id}`);
    if (!shape.parent) throw new Error(`shape has no parent: ${this.id}`);
    this.group = shape;
    this.parent = shape.parent;
    this.index = shape.parent.indexOf(shape);
    this.children = [...shape.items];
  }
}
