import type { Command } from "./commandClass";
import type { Message } from "discord.js";

export type CommandMap = Map<string, Command>;
export type CommandRunner<InGuild extends boolean = boolean> = (
  message: Message<InGuild>,
  args: string[]
) => unknown;

export interface CommandData<InGuild extends boolean = boolean> {
  name: string;
  aliases?: string[];
  guildOnly?: InGuild;
  dmOnly?: boolean;
  developerOnly?: boolean;
  run: CommandRunner<InGuild>;
}

export interface CommandHandlerConstructorData {
  commandsDir?: string;
  developerIds?: string[];
  prefix?: string;
  suppressWarnings?: boolean;
}
