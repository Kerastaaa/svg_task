import type { Command } from "./Command.js";
import type { DocumentModel } from "../domain/Document.js";
import { Group } from "../domain/Group.js";
import type { Shape } from "../domain/Shape.js";

export class AddToCommand implements Command {
  private shape: Shape | undefined;
  private target: Group | undefined;
  private oldParent: Group | undefined;
  private oldIndex: number | undefined;

  constructor(
    private readonly document: DocumentModel,
    private readonly shapeId: string,
    private readonly targetId: string,
  ) {}

  execute(): string {
    if (!this.shape) this.captureAndValidate();
    if (!this.shape || !this.target) throw new Error("addto command is not initialized");
    this.target.add(this.shape);
    return `${this.shape.kind}#${this.shape.id} added to g#${this.target.id}`;
  }

  undo(): string {
    if (!this.shape || !this.oldParent || this.oldIndex === undefined) throw new Error("addto command was not executed");
    this.oldParent.add(this.shape, this.oldIndex);
    return `${this.shape.kind}#${this.shape.id} returned to original parent`;
  }

  private captureAndValidate(): void {
    const shape = this.document.findById(this.shapeId);
    if (!shape) throw new Error(`no such shape: ${this.shapeId}`);
    const target = this.document.findById(this.targetId);
    if (!target) throw new Error(`no such container: ${this.targetId}`);
    if (!(target instanceof Group)) throw new Error(`not a container: ${this.targetId}`);
    if (!shape.parent) throw new Error(`shape has no parent: ${this.shapeId}`);
    if (shape === target || shape instanceof Group && shape.contains(target.id)) {
      throw new Error("cannot create a cyclic shape tree");
    }
    this.shape = shape;
    this.target = target;
    this.oldParent = shape.parent;
    this.oldIndex = shape.parent.indexOf(shape);
  }
}
