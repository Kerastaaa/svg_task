import { Circle } from "../domain/Circle.js";
import { Ellipse } from "../domain/Ellipse.js";
import { Group } from "../domain/Group.js";
import { Line } from "../domain/Line.js";
import { Rect } from "../domain/Rect.js";
import { Shape } from "../domain/Shape.js";
import { Text } from "../domain/Text.js";

type NumberParser = (name: string, value: string) => number;

export class ShapeFactory {
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
}
