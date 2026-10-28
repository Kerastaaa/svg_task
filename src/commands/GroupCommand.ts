import type { Command } from "./Command.js";
import type { DocumentModel } from "../domain/Document.js";
import { Group } from "../domain/Group.js";
import type { Shape } from "../domain/Shape.js";

interface OriginalLocation {
  shape: Shape;
  parent: Group;
  index: number;
}

export class GroupCommand implements Command {
  private readonly group: Group;
  private locations: OriginalLocation[] | undefined;
  private destination: Group | undefined;
  private destinationIndex: number | undefined;

  constructor(
    private readonly document: DocumentModel,
    groupId: string,
    private readonly ids: string[],
  ) {
    this.group = new Group(groupId);
  }

  execute(): string {
    if (!this.locations) this.captureAndValidate();
    if (!this.locations || !this.destination || this.destinationIndex === undefined) {
      throw new Error("group command is not initialized");
    }

    this.destination.add(this.group, this.destinationIndex);
    for (const location of this.locations) this.group.add(location.shape);
    return `g#${this.group.id} created with ${this.locations.length} children`;
  }

  undo(): string {
    if (!this.locations || !this.destination) throw new Error("group command was not executed");
    this.destination.remove(this.group);
    for (const location of this.locations) this.group.remove(location.shape);

    const parents = [...new Set(this.locations.map((location) => location.parent))];
    for (const parent of parents) {
      const ordered = this.locations
        .filter((location) => location.parent === parent)
        .sort((a, b) => a.index - b.index);
      for (const location of ordered) parent.add(location.shape, location.index);
    }
    return `g#${this.group.id} grouping undone`;
  }

  private captureAndValidate(): void {
    if (this.ids.length < 1) throw new Error("group requires at least one shape");
    if (this.document.hasId(this.group.id)) throw new Error(`id already exists: ${this.group.id}`);
    if (new Set(this.ids).size !== this.ids.length) throw new Error("cannot group duplicate shapes");

    const shapes = this.ids.map((id) => {
      const shape = this.document.findById(id);
      if (!shape) throw new Error(`no such shape: ${id}`);
      if (!shape.parent) throw new Error(`shape has no parent: ${id}`);
      return shape;
    });

    for (const shape of shapes) {
      if (shape instanceof Group && shapes.some((candidate) => candidate !== shape && shape.contains(candidate.id))) {
        throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
      }
    }

    const locations = shapes.map((shape) => ({
      shape,
      parent: shape.parent as Group,
      index: (shape.parent as Group).indexOf(shape),
    }));
    const destination = locations[0]?.parent;
    if (!destination) throw new Error("group has no destination parent");

    const destinationLocations = locations.filter((location) => location.parent === destination);
    this.destination = destination;
    this.destinationIndex = Math.min(...destinationLocations.map((location) => location.index));
    this.locations = locations;
  }
}
