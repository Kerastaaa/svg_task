import { DocumentModel } from "../domain/Document.js";
import { Group } from "../domain/Group.js";
import { Shape } from "../domain/Shape.js";
import { Circle } from "../domain/Circle.js";
import { Ellipse } from "../domain/Ellipse.js";
import { Line } from "../domain/Line.js";
import { Rect } from "../domain/Rect.js";
import { Text } from "../domain/Text.js";

export class QueryFormatter {
  tree(document: DocumentModel, id?: string): string {
    if (id === undefined) {
      const lines = [`svg (${document.width}x${document.height})`];
      document.root.items.forEach((shape, index, items) => this.appendTree(lines, shape, "", index === items.length - 1));
      return lines.join("\n");
    }

    const shape = document.findById(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    const lines: string[] = [];
    this.appendTree(lines, shape, "", true);
    return lines.join("\n");
  }

  show(document: DocumentModel, id: string): string {
    const shape = document.findById(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    const parent = shape.parent === document.root ? "svg" : shape.parent ? `${shape.parent.kind}#${shape.parent.id}` : "svg";
    const lines = [`${shape.kind}#${shape.id}  parent=${parent}`];
    lines.push(...this.attributes(shape).map((attribute) => `  ${attribute}`));
    return lines.join("\n");
  }

  private appendTree(lines: string[], shape: Shape, prefix: string, last: boolean): void {
    const branch = last ? "└── " : "├── ";
    lines.push(`${prefix}${branch}${this.summary(shape)}`);
    if (shape instanceof Group) {
      const childPrefix = `${prefix}${last ? "    " : "│   "}`;
      shape.items.forEach((child, index, items) => this.appendTree(lines, child, childPrefix, index === items.length - 1));
    }
  }

  private summary(shape: Shape): string {
    if (shape instanceof Group) return `g#${shape.id}`;
    if (shape instanceof Rect) return `rect#${shape.id}  x=${shape.x} y=${shape.y} w=${shape.width} h=${shape.height}${this.color(shape.fill)}`;
    if (shape instanceof Circle) return `circle#${shape.id}  cx=${shape.cx} cy=${shape.cy} r=${shape.r}${this.color(shape.fill)}`;
    if (shape instanceof Ellipse) return `ellipse#${shape.id}  cx=${shape.cx} cy=${shape.cy} rx=${shape.rx} ry=${shape.ry}${this.color(shape.fill)}`;
    if (shape instanceof Line) return `line#${shape.id}  (${shape.x1},${shape.y1}) -> (${shape.x2},${shape.y2})${this.color(shape.stroke, "stroke")}`;
    if (shape instanceof Text) return `text#${shape.id}  (${shape.x},${shape.y}) "${shape.content}"`;
    return `${shape.kind}#${shape.id}`;
  }

  private attributes(shape: Shape): string[] {
    if (shape instanceof Group) return [`children=${shape.items.length}`];
    if (shape instanceof Rect) return [`x=${shape.x} y=${shape.y} w=${shape.width} h=${shape.height}`, ...this.optionalColor(shape.fill)];
    if (shape instanceof Circle) return [`cx=${shape.cx} cy=${shape.cy} r=${shape.r}`, ...this.optionalColor(shape.fill)];
    if (shape instanceof Ellipse) return [`cx=${shape.cx} cy=${shape.cy} rx=${shape.rx} ry=${shape.ry}`, ...this.optionalColor(shape.fill)];
    if (shape instanceof Line) return [`x1=${shape.x1} y1=${shape.y1} x2=${shape.x2} y2=${shape.y2}`, ...this.optionalColor(shape.stroke, "stroke")];
    if (shape instanceof Text) return [`x=${shape.x} y=${shape.y}`, `text="${shape.content}"`, ...this.optionalColor(shape.fill)];
    return [];
  }

  private color(value: string | undefined, name = "fill"): string {
    return value === undefined ? "" : ` ${name}=${value}`;
  }

  private optionalColor(value: string | undefined, name = "fill"): string[] {
    return value === undefined ? [] : [`${name}=${value}`];
  }
}
