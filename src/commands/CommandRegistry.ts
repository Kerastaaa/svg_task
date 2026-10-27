export type CommandHandler = (args: string[]) => string[];

export class CommandRegistry {
  private readonly handlers = new Map<string, CommandHandler>();

  register(name: string, handler: CommandHandler): void {
    if (this.handlers.has(name)) throw new Error(`command already registered: ${name}`);
    this.handlers.set(name, handler);
  }

  dispatch(name: string, args: string[]): string[] {
    const handler = this.handlers.get(name);
    if (!handler) throw new Error(`unknown command: ${name}`);
    return handler(args);
  }

  names(): string[] {
    return [...this.handlers.keys()];
  }
}
