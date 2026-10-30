import { XMLParser, XMLValidator } from "fast-xml-parser";
import { DocumentModel } from "../domain/Document.js";
import { Group } from "../domain/Group.js";
import { ShapeFactory } from "../factory/ShapeFactory.js";

type XmlNode = Record<string, unknown>;
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
  private readonly factory = new ShapeFactory();

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
    ): void => {
      for (const node of nodes) {
        const tag = this.tagName(node);
        if (!tag || tag === "#text" || tag === "#comment") continue;
        if (!this.factory.supports(tag)) continue;

        const attributes = this.attributes(node);
        const id = assignId(tag, attributes);
        const transform = this.combine(inheritedTransform, this.parseTransform(attributes.transform));
        const shape = this.factory.createFromSvg(tag, id, {
          attributes,
          text: this.textContent(node),
          transform,
        });

        parent.add(shape);
        elementCount += 1;
        if (shape instanceof Group) parseChildren(shape, this.children(node), transform);
      }
    };

    parseChildren(document.root, this.children(rootNode), { scale: 1, x: 0, y: 0 });
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
