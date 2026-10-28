import type { Command } from "../commands/Command.js";

export class CommandHistory {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];
  private undoBlockedByIo = false;

  execute(command: Command): string {
    const result = command.execute();
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.undoBlockedByIo = false;
    return result;
  }

  undo(): string {
    if (this.undoBlockedByIo) throw new Error("undo not allowed after io command");
    const command = this.undoStack.pop();
    if (!command) throw new Error("nothing to undo");
    const result = command.undo();
    this.redoStack.push(command);
    return result;
  }

  redo(): string {
    if (this.undoBlockedByIo) throw new Error("undo not allowed after io command");
    const command = this.redoStack.pop();
    if (!command) throw new Error("nothing to redo");
    const result = command.execute();
    this.undoStack.push(command);
    return result;
  }

  blockAfterIo(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.undoBlockedByIo = true;
  }
}
