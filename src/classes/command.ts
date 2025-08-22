import { CommandData, CommandTypes } from "@/types/commands.js";
import { CommandConfig } from "./commandConfig.js";

export class Command<Type extends CommandTypes> {
  private name?: string;
  private commandPath?: string[];
  public readonly config: CommandConfig<Type>;

  constructor(options: CommandData<Type> = {}) {
    this.config = (options.config ??
      new CommandConfig()) as CommandConfig<Type>;
    // TODO: Do the verifications (in the handler)
  }

  public isSlashOnly(): this is Command<CommandTypes.Slash> {
    return this.config.type === CommandTypes.Slash;
  }

  public isMessageOnly(): this is Command<CommandTypes.Message> {
    return this.config.type === CommandTypes.Message;
  }

  public isCombined(): this is Command<CommandTypes.Combined> {
    return this.config.type === CommandTypes.Combined;
  }

  public canUseSlash(): this is Command<
    CommandTypes.Combined | CommandTypes.Slash
  > {
    return (
      this.config.type === CommandTypes.Combined ||
      this.config.type === CommandTypes.Slash
    );
  }

  public canUseMessage(): this is Command<
    CommandTypes.Combined | CommandTypes.Message
  > {
    return (
      this.config.type === CommandTypes.Combined ||
      this.config.type === CommandTypes.Message
    );
  }

  public getName(): string {
    if (!this.name?.length) {
      // TODO: Throw error
      return "";
    }

    return this.name;
  }

  public setName(name: string): this {
    if (this.name !== undefined) {
      // TODO: Throw error
      return this;
    }

    this.name = name;
    return this;
  }

  public getCommandPath(): string[] {
    if (this.commandPath === undefined) {
      // TODO: Throw error
      return [];
    }

    return this.commandPath;
  }

  public setCommandPath(commandPath: string[]): this {
    if (this.commandPath !== undefined) {
      // TODO: Throw error
      return this;
    }

    this.commandPath = commandPath;
    return this;
  }
}
