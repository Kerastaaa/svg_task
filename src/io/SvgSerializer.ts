import { DocumentModel } from "../domain/Document.js";
import { Group } from "../domain/Group.js";
import type { Shape } from "../domain/Shape.js";

export class SvgSerializer {
  serialize(document: DocumentModel): string {
    const children = document.root.items.map((shape) => shape.toSvg("  ")).join("\n");
    const body = children.length === 0 ? "" : `\n${children}\n`;
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}">${body}</svg>`,
      "",
    ].join("\n");
  }

  countElements(document: DocumentModel): number {
    const count = (shapes: readonly Shape[]): number => shapes.reduce(
      (total, shape) => total + 1 + (shape instanceof Group ? count(shape.items) : 0),
      0,
    );
    return count(document.root.items);
  }
}
