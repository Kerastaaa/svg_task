import { Circle } from "../domain/Circle.js";
import { Ellipse } from "../domain/Ellipse.js";
import { Group } from "../domain/Group.js";
import { Line } from "../domain/Line.js";
import { Rect } from "../domain/Rect.js";
import { Shape } from "../domain/Shape.js";
import { Text } from "../domain/Text.js";

type NumberParser = (name: string, value: string) => number;

export interface SvgShapeInput {
  attributes: Record<string, string>;
  text: string;
  transform: { scale: number; x: number; y: number };
}

export class ShapeFactory {
  supports(type: string): boolean {
    return type === "rect" || type === "circle" || type === "ellipse" || type === "line" || type === "text" || type === "g";
  }

  create(type: string, id: string, args: string[]): Shape {
    const number = this.parseNumber;
    switch (type) {
      case "rect":
        this.requireLength(type, args, 4, 5);
        return new Rect(id, number("x", this.required(args, 0)), number("y", this.required(args, 1)), number("width", this.required(args, 2)), number("height", this.required(args, 3)), args[4]);
      case "circle":
        this.requireLength(type, args, 3, 4);
        return new Circle(id, number("cx", this.required(args, 0)), number("cy", this.required(args, 1)), number("r", this.required(args, 2)), args[3]);
      case "ellipse":
        this.requireLength(type, args, 4, 5);
        return new Ellipse(id, number("cx", this.required(args, 0)), number("cy", this.required(args, 1)), number("rx", this.required(args, 2)), number("ry", this.required(args, 3)), args[4]);
      case "line":
        this.requireLength(type, args, 4, 5);
        return new Line(id, number("x1", this.required(args, 0)), number("y1", this.required(args, 1)), number("x2", this.required(args, 2)), number("y2", this.required(args, 3)), args[4]);
      case "text":
        this.requireLength(type, args, 3, 3);
        return new Text(id, number("x", this.required(args, 0)), number("y", this.required(args, 1)), this.required(args, 2));
      case "g":
        this.requireLength(type, args, 0, 0);
        return new Group(id);
      default:
        throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
  }

  createFromSvg(type: string, id: string, input: SvgShapeInput): Shape {
    const { attributes, text, transform } = input;
    const point = (xName: string, yName: string): [number, number] => [
      this.svgNumber(xName, attributes[xName]) * transform.scale + transform.x,
      this.svgNumber(yName, attributes[yName]) * transform.scale + transform.y,
    ];
    let shape: Shape;

    switch (type) {
      case "rect": {
        const [x, y] = point("x", "y");
        shape = new Rect(id, x, y,
          this.svgNumber("width", attributes.width) * transform.scale,
          this.svgNumber("height", attributes.height) * transform.scale);
        break;
      }
      case "circle": {
        const [cx, cy] = point("cx", "cy");
        shape = new Circle(id, cx, cy, this.svgNumber("r", attributes.r) * transform.scale);
        break;
      }
      case "ellipse": {
        const [cx, cy] = point("cx", "cy");
        shape = new Ellipse(id, cx, cy,
          this.svgNumber("rx", attributes.rx) * transform.scale,
          this.svgNumber("ry", attributes.ry) * transform.scale);
        break;
      }
      case "line": {
        const [x1, y1] = point("x1", "y1");
        const [x2, y2] = point("x2", "y2");
        shape = new Line(id, x1, y1, x2, y2);
        break;
      }
      case "text": {
        const [x, y] = point("x", "y");
        shape = new Text(id, x, y, text);
        break;
      }
      case "g":
        shape = new Group(id);
        break;
      default:
        throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    }

    if (attributes.fill !== undefined) shape.setAttribute("fill", attributes.fill);
    if (attributes.stroke !== undefined) shape.setAttribute("stroke", attributes.stroke);
    if (attributes["stroke-width"] !== undefined) {
      shape.setAttribute("stroke-width", String(this.svgNumber("stroke-width", attributes["stroke-width"]) * transform.scale));
    }
    return shape;
  }

  private readonly parseNumber: NumberParser = (name, value) => {
    if (value === undefined) throw new Error(`missing numeric argument: ${name}`);
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`invalid number for ${name}: ${value}`);
    return parsed;
  };

  private requireLength(type: string, args: string[], minimum: number, maximum: number): void {
    if (args.length < minimum || args.length > maximum) {
      throw new Error(`invalid arguments for create ${type}`);
    }
  }

  private required(args: string[], index: number): string {
    const value = args[index];
    if (value === undefined) throw new Error("missing create argument");
    return value;
  }

  private svgNumber(name: string, value: string | undefined): number {
    if (value === undefined) throw new Error(`missing SVG attribute: ${name}`);
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`invalid SVG ${name}: ${value}`);
    return parsed;
  }
}
