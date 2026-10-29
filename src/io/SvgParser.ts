import { XMLParser, XMLValidator } from "fast-xml-parser";
import { Circle } from "../domain/Circle.js";
import { DocumentModel } from "../domain/Document.js";
import { Ellipse } from "../domain/Ellipse.js";
import { Group } from "../domain/Group.js";
import { Line } from "../domain/Line.js";
import { Rect } from "../domain/Rect.js";
import { Text } from "../domain/Text.js";
import type { Shape } from "../domain/Shape.js";

type XmlNode = Record<string, unknown>;
type CommonAttributes = { fill?: string | undefined; stroke?: string | undefined; strokeWidth?: number | undefined };
type Transform = { scale: number; x: number; y: number };

export interface SvgParseResult {
  document: DocumentModel;
  warnings: string[];
  elementCount: number;
}

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: false,
});

export class SvgParser {
  parse(source: string): SvgParseResult {
    const validation = XMLValidator.validate(source);
    if (validation !== true) {
      throw new Error(`invalid SVG XML at ${validation.err.line}:${validation.err.col}: ${validation.err.msg}`);
    }

    const parsed = parser.parse(source) as XmlNode[];
    const rootNode = parsed.find((node) => this.tagName(node) === "svg");
    if (!rootNode) throw new Error("document root must be <svg>");

    const rootAttributes = this.attributes(rootNode);
    const viewBox = this.parseViewBox(rootAttributes["viewBox"]);
    const width = this.canvasDimension(rootAttributes.width, viewBox?.width ?? 800, "width");
    const height = this.canvasDimension(rootAttributes.height, viewBox?.height ?? 600, "height");
    const document = new DocumentModel(width, height);
    const warnings: string[] = [];
    const counters = new Map<string, number>();
    const usedIds = new Set<string>();
    const reservedIds = new Set<string>();
    let elementCount = 0;

    const collectIds = (nodes: XmlNode[]): void => {
      for (const node of nodes) {
        const tag = this.tagName(node);
        if (!tag || tag.startsWith("#")) continue;
        const id = this.attributes(node).id;
        if (id !== undefined && id.length > 0) reservedIds.add(id);
        collectIds(this.children(node));
      }
    };
    collectIds(this.children(rootNode));

    const assignId = (tag: string, attributes: Record<string, string>): string => {
      if (attributes.id !== undefined && attributes.id.length > 0) {
        if (usedIds.has(attributes.id)) throw new Error(`id already exists: ${attributes.id}`);
        usedIds.add(attributes.id);
        return attributes.id;
      }
      let sequence = (counters.get(tag) ?? 0) + 1;
      let id = `${tag}${sequence}`;
      while (usedIds.has(id) || reservedIds.has(id)) {
        sequence += 1;
        id = `${tag}${sequence}`;
      }
      counters.set(tag, sequence);
      usedIds.add(id);
      warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
      return id;
    };

    const parseChildren = (
      parent: Group,
      nodes: XmlNode[],
      inheritedTransform: Transform,
      inheritedAttributes: CommonAttributes,
    ): void => {
      for (const node of nodes) {
        const tag = this.tagName(node);
        if (!tag || tag === "#text" || tag === "#comment") continue;
        if (tag !== "g" && tag !== "rect" && tag !== "circle" && tag !== "ellipse" && tag !== "line" && tag !== "text") {
          continue;
        }

        const attributes = this.attributes(node);
        const id = assignId(tag, attributes);
        const transform = this.combine(inheritedTransform, this.parseTransform(attributes.transform));
        const common = this.commonAttributes(attributes, inheritedAttributes);
        let shape: Shape;

        if (tag === "g") {
          const group = new Group(id);
          group.fill = common.fill;
          group.stroke = common.stroke;
          group.strokeWidth = common.strokeWidth;
          parent.add(group);
          elementCount += 1;
          parseChildren(group, this.children(node), transform, common);
          continue;
        } else if (tag === "rect") {
          const x = this.coordinate(attributes.x, "x");
          const y = this.coordinate(attributes.y, "y");
          shape = new Rect(id, transform.scale * x + transform.x, transform.scale * y + transform.y,
            this.coordinate(attributes.width, "width") * transform.scale,
            this.coordinate(attributes.height, "height") * transform.scale,
            common.fill, common.stroke, common.strokeWidth);
        } else if (tag === "circle") {
          const [cx, cy] = this.point(attributes.cx, attributes.cy, transform);
          shape = new Circle(id, cx, cy, this.coordinate(attributes.r, "r") * transform.scale,
            common.fill, common.stroke, common.strokeWidth);
        } else if (tag === "ellipse") {
          const [cx, cy] = this.point(attributes.cx, attributes.cy, transform);
          shape = new Ellipse(id, cx, cy, this.coordinate(attributes.rx, "rx") * transform.scale,
            this.coordinate(attributes.ry, "ry") * transform.scale,
            common.fill, common.stroke, common.strokeWidth);
        } else if (tag === "line") {
          const [x1, y1] = this.point(attributes.x1, attributes.y1, transform);
          const [x2, y2] = this.point(attributes.x2, attributes.y2, transform);
          shape = new Line(id, x1, y1, x2, y2, common.stroke, common.fill,
            common.strokeWidth === undefined ? undefined : common.strokeWidth * transform.scale);
        } else {
          const [x, y] = this.point(attributes.x, attributes.y, transform);
          shape = new Text(id, x, y, this.textContent(node), common.fill, common.stroke,
            common.strokeWidth === undefined ? undefined : common.strokeWidth * transform.scale);
        }

        parent.add(shape);
        elementCount += 1;
      }
    };

    parseChildren(document.root, this.children(rootNode), { scale: 1, x: 0, y: 0 }, {});
    return { document, warnings, elementCount };
  }

  private tagName(node: XmlNode): string | undefined {
    return Object.keys(node).find((key) => key !== ":@");
  }

  private children(node: XmlNode): XmlNode[] {
    const tag = this.tagName(node);
    const value = tag === undefined ? undefined : node[tag];
    return Array.isArray(value) ? value as XmlNode[] : [];
  }

  private attributes(node: XmlNode): Record<string, string> {
    const raw = node[":@"];
    if (!raw || typeof raw !== "object") return {};
    return Object.fromEntries(Object.entries(raw as Record<string, unknown>)
      .filter(([key, value]) => key.startsWith("@_") && value !== undefined)
      .map(([key, value]) => [key.slice(2), String(value)]));
  }

  private commonAttributes(
    attributes: Record<string, string>,
    inherited: CommonAttributes,
  ): CommonAttributes {
    const fill = attributes.fill ?? inherited.fill;
    const stroke = attributes.stroke ?? inherited.stroke;
    const strokeWidth = attributes["stroke-width"] === undefined
      ? inherited.strokeWidth
      : this.coordinate(attributes["stroke-width"], "stroke-width");
    return { fill, stroke, strokeWidth };
  }

  private parseViewBox(value: string | undefined): { width: number; height: number } | undefined {
    if (value === undefined) return undefined;
    const parts = value.trim().split(/[\s,]+/).map(Number);
    if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part)) || parts[2]! <= 0 || parts[3]! <= 0) {
      throw new Error(`invalid SVG viewBox: ${value}`);
    }
    return { width: parts[2]!, height: parts[3]! };
  }

  private canvasDimension(value: string | undefined, fallback: number, name: string): number {
    if (value === undefined) return fallback;
    const match = /^\s*([+-]?(?:\d+\.?\d*|\.\d+))(?:px)?\s*$/.exec(value);
    if (!match) throw new Error(`invalid SVG ${name}: ${value}`);
    const dimension = Number(match[1]);
    if (!Number.isFinite(dimension) || dimension <= 0) throw new Error(`invalid SVG ${name}: ${value}`);
    return dimension;
  }

  private coordinate(value: string | undefined, name: string): number {
    if (value === undefined) throw new Error(`missing SVG attribute: ${name}`);
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`invalid SVG ${name}: ${value}`);
    return parsed;
  }

  private point(x: string | undefined, y: string | undefined, transform: Transform): [number, number] {
    return [
      transform.scale * this.coordinate(x, "x") + transform.x,
      transform.scale * this.coordinate(y, "y") + transform.y,
    ];
  }

  private parseTransform(value: string | undefined): Transform {
    if (value === undefined || value.trim() === "") return { scale: 1, x: 0, y: 0 };
    let result: Transform = { scale: 1, x: 0, y: 0 };
    const operation = /(translate|scale)\s*\(([^)]*)\)/gy;
    let consumed = 0;
    while (consumed < value.length) {
      while (/\s|,/.test(value[consumed] ?? "")) consumed += 1;
      if (consumed >= value.length) break;
      operation.lastIndex = consumed;
      const match = operation.exec(value);
      if (!match || match.index !== consumed) throw new Error(`unsupported SVG transform: ${value}`);
      const numbers = match[2]!.trim().split(/[\s,]+/).map(Number);
      if (numbers.some((number) => !Number.isFinite(number))) throw new Error(`invalid SVG transform: ${value}`);
      let next: Transform;
      if (match[1] === "translate") {
        if (numbers.length < 1 || numbers.length > 2) throw new Error(`invalid SVG transform: ${value}`);
        next = { scale: 1, x: numbers[0]!, y: numbers[1] ?? 0 };
      } else {
        if (numbers.length < 1 || numbers.length > 2 || numbers[0]! <= 0 || numbers[1] !== undefined && numbers[1] !== numbers[0]) {
          throw new Error(`unsupported SVG scale: ${value}`);
        }
        next = { scale: numbers[0]!, x: 0, y: 0 };
      }
      result = this.combine(result, next);
      consumed = operation.lastIndex;
    }
    return result;
  }

  private combine(parent: Transform, local: Transform): Transform {
    return {
      scale: parent.scale * local.scale,
      x: parent.scale * local.x + parent.x,
      y: parent.scale * local.y + parent.y,
    };
  }

  private textContent(node: XmlNode): string {
    return this.children(node)
      .filter((child) => child["#text"] !== undefined && typeof child["#text"] !== "object")
      .map((child) => String(child["#text"]))
      .join("");
  }
}
