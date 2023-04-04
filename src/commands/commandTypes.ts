import type { Command } from "./commandClass";
import type {
  Awaitable,
  CommandInteraction,
  Message,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import type { SlashCommand } from "./slashCommandClass";

//* Normal commands

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
  slashCommandsDir?: string;
  developerIds?: string[];
  prefix?: string;
  suppressWarnings?: boolean;
}

//* Slash commands

export type SlashCommandMap = Map<string, SlashCommand>;

export type SlashCommandBuilderData =
  | ((builder: SlashCommandBuilder) => SlashCommandBuilders)
  | SlashCommandBuilders;

export type SlashCommandBuilders =
  | SlashCommandBuilder
  | SlashCommandSubcommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandGroupBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">;

export type SlashCommandRunner = (interaction: CommandInteraction) => Awaitable<unknown>;

export interface SlashCommandData {
  slashCommandData: SlashCommandBuilderData;
  run: SlashCommandRunner;
}
