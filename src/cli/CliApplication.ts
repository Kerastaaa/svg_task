import { DocumentModel } from "../domain/Document.js";
import { ShapeFactory } from "../factory/ShapeFactory.js";
import { CommandRegistry } from "../commands/CommandRegistry.js";
import { CreateShapeCommand } from "../commands/CreateShapeCommand.js";
import { DeleteShapeCommand } from "../commands/DeleteShapeCommand.js";
import { MoveCommand } from "../commands/MoveCommand.js";
import { ScaleCommand } from "../commands/ScaleCommand.js";
import { SetAttributeCommand } from "../commands/SetAttributeCommand.js";
import { GroupCommand } from "../commands/GroupCommand.js";
import { UngroupCommand } from "../commands/UngroupCommand.js";
import { AddToCommand } from "../commands/AddToCommand.js";
import { ReorderCommand, type ReorderDirection } from "../commands/ReorderCommand.js";
import { CommandHistory } from "../history/CommandHistory.js";
import { SvgFileService } from "../io/SvgFileService.js";
import { QueryFormatter } from "../query/QueryFormatter.js";
import { tokenize } from "./Tokenizer.js";

export class CliApplication {
  private document: DocumentModel | null = null;
  private readonly factory = new ShapeFactory();
  private readonly query = new QueryFormatter();
  private readonly registry = new CommandRegistry();
  private readonly history = new CommandHistory();
  private readonly files = new SvgFileService();
  private currentPath: string | undefined;

  constructor() {
    this.registerCommands();
  }

  executeLine(line: string): string[] {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) return [];

    try {
      const [name, ...args] = tokenize(trimmed);
      if (!name) return [];
      return this.registry.dispatch(name, args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return [message.startsWith("error:") ? message : `error: ${message}`];
    }
  }

  private registerCommands(): void {
    this.registry.register("help", () => [this.helpText()]);
    this.registry.register("init", (args) => [this.init(args)]);
    this.registry.register("canvas", (args) => [this.canvas(args)]);
    this.registry.register("create", (args) => [this.create(args)]);
    this.registry.register("tree", (args) => [this.tree(args)]);
    this.registry.register("show", (args) => [this.show(args)]);
    this.registry.register("move", (args) => [this.move(args)]);
    this.registry.register("scale", (args) => [this.scale(args)]);
    this.registry.register("set", (args) => [this.set(args)]);
    this.registry.register("delete", (args) => [this.delete(args)]);
    this.registry.register("group", (args) => [this.group(args)]);
    this.registry.register("ungroup", (args) => [this.ungroup(args)]);
    this.registry.register("addto", (args) => [this.addTo(args)]);
    this.registry.register("front", (args) => [this.reorder(args, "front")]);
    this.registry.register("back", (args) => [this.reorder(args, "back")]);
    this.registry.register("undo", (args) => [this.undo(args)]);
    this.registry.register("redo", (args) => [this.redo(args)]);

    this.registry.register("read", (args) => this.read(args));
    this.registry.register("save", (args) => [this.save(args)]);
  }

  private init(args: string[]): string {
    if (args.length !== 0 && args.length !== 2) throw new Error("usage: init [w] [h]");
    const width = args.length === 2 ? this.number("width", this.required(args, 0)) : 800;
    const height = args.length === 2 ? this.number("height", this.required(args, 1)) : 600;
    this.document = new DocumentModel(width, height);
    this.currentPath = undefined;
    this.history.blockAfterIo();
    return `canvas ${width}x${height} created`;
  }

  private read(args: string[]): string[] {
    if (args.length !== 1) throw new Error("usage: read <file.svg>");
    const path = this.required(args, 0);
    const result = this.files.read(path);
    this.document = result.document;
    this.currentPath = path;
    this.history.blockAfterIo();
    return [...result.warnings, `read ${path} (${result.elementCount} elements)`];
  }

  private save(args: string[]): string {
    if (args.length > 1) throw new Error("usage: save [file.svg]");
    const document = this.requireDocument();
    const path = args[0] ?? this.currentPath;
    if (!path) throw new Error("no file path specified; use 'save <file.svg>'");
    const count = this.files.save(path, document);
    this.currentPath = path;
    this.history.blockAfterIo();
    return `saved to ${path} (${count} elements)`;
  }

  private canvas(args: string[]): string {
    const document = this.requireDocument();
    if (args.length === 0) return `canvas ${document.width}x${document.height}`;
    if (args.length !== 2) throw new Error("usage: canvas [w] [h]");
    document.resize(this.number("width", this.required(args, 0)), this.number("height", this.required(args, 1)));
    this.history.blockAfterIo();
    return `canvas resized to ${document.width}x${document.height}`;
  }

  private create(args: string[]): string {
    const document = this.requireDocument();
    if (args.length < 2) throw new Error("usage: create <type> <id> [params...] [in <containerId>]");
    const [type, id, ...rest] = args;
    if (type === undefined || id === undefined) throw new Error("usage: create <type> <id> [params...] [in <containerId>]");
    const inIndex = rest.indexOf("in");
    let shapeArgs = rest;
    let parentId: string | undefined;
    if (inIndex >= 0) {
      if (inIndex !== rest.length - 2 || rest[inIndex + 1] === undefined) {
        throw new Error("invalid in clause");
      }
      shapeArgs = rest.slice(0, inIndex);
      parentId = this.required(rest, inIndex + 1);
    }

    const shape = this.factory.create(type, id, shapeArgs);
    return this.history.execute(new CreateShapeCommand(document, shape, parentId));
  }

  private tree(args: string[]): string {
    if (args.length > 1) throw new Error("usage: tree [id]");
    return this.query.tree(this.requireDocument(), args[0]);
  }

  private show(args: string[]): string {
    if (args.length !== 1) throw new Error("usage: show <id>");
    return this.query.show(this.requireDocument(), this.required(args, 0));
  }

  private move(args: string[]): string {
    if (args.length !== 3) throw new Error("usage: move <id> <dx> <dy>");
    const shape = this.requireShape(this.required(args, 0));
    const dx = this.number("dx", this.required(args, 1));
    const dy = this.number("dy", this.required(args, 2));
    return this.history.execute(new MoveCommand(shape, dx, dy));
  }

  private scale(args: string[]): string {
    if (args.length !== 2) throw new Error("usage: scale <id> <factor>");
    const shape = this.requireShape(this.required(args, 0));
    const factor = this.number("factor", this.required(args, 1));
    return this.history.execute(new ScaleCommand(shape, factor));
  }

  private set(args: string[]): string {
    if (args.length !== 3) throw new Error("usage: set <id> <attr> <value>");
    const shape = this.requireShape(this.required(args, 0));
    const attribute = this.required(args, 1);
    const value = this.required(args, 2);
    return this.history.execute(new SetAttributeCommand(shape, attribute, value));
  }

  private delete(args: string[]): string {
    if (args.length !== 1) throw new Error("usage: delete <id>");
    return this.history.execute(new DeleteShapeCommand(this.requireDocument(), this.required(args, 0)));
  }

  private group(args: string[]): string {
    if (args.length < 2) throw new Error("usage: group <newGid> <id1> <id2>...");
    const groupId = this.required(args, 0);
    return this.history.execute(new GroupCommand(this.requireDocument(), groupId, args.slice(1)));
  }

  private ungroup(args: string[]): string {
    if (args.length !== 1) throw new Error("usage: ungroup <gid>");
    return this.history.execute(new UngroupCommand(this.requireDocument(), this.required(args, 0)));
  }

  private addTo(args: string[]): string {
    if (args.length !== 2) throw new Error("usage: addto <gid> <id>");
    return this.history.execute(
      new AddToCommand(this.requireDocument(), this.required(args, 1), this.required(args, 0)),
    );
  }

  private reorder(args: string[], direction: ReorderDirection): string {
    if (args.length !== 1) throw new Error(`usage: ${direction} <id>`);
    return this.history.execute(new ReorderCommand(this.requireShape(this.required(args, 0)), direction));
  }

  private undo(args: string[]): string {
    if (args.length !== 0) throw new Error("usage: undo");
    return this.history.undo();
  }

  private redo(args: string[]): string {
    if (args.length !== 0) throw new Error("usage: redo");
    return this.history.redo();
  }

  private requireDocument(): DocumentModel {
    if (!this.document) throw new Error("no document. use 'init' or 'read' first");
    return this.document;
  }

  private requireShape(id: string): import("../domain/Shape.js").Shape {
    const shape = this.requireDocument().findById(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }

  private number(name: string, value: string | undefined): number {
    if (value === undefined) throw new Error(`missing argument: ${name}`);
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`invalid number for ${name}: ${value}`);
    return parsed;
  }

  private required(args: string[], index: number): string {
    const value = args[index];
    if (value === undefined) throw new Error("missing argument");
    return value;
  }

  private helpText(): string {
    return [
      "Document:",
      "  init [w] [h]",
      "  read <file.svg>",
      "  save [file.svg]",
      "  canvas [w] [h]",
      "Edit:",
      "  create <type> <id> [params...] [in <containerId>]",
      "  delete <id>",
      "  move <id> <dx> <dy>",
      "  scale <id> <factor>",
      "  set <id> <attr> <value>",
      "  group <newGid> <id1> <id2>...",
      "  ungroup <gid>",
      "  addto <gid> <id>",
      "  front <id>",
      "  back <id>",
      "View: tree [id], show <id>, help",
      "History: undo, redo",
      "Session: exit, quit",
    ].join("\n");
  }
}
