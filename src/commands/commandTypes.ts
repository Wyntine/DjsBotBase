import type { Command } from "./commandClass";
import type {
  Awaitable,
  ChatInputCommandInteraction,
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
  readonly name: string;
  readonly aliases?: string[];
  readonly guildOnly?: InGuild;
  readonly dmOnly?: boolean;
  readonly developerOnly?: boolean;
  readonly maintenance?: boolean;
  readonly cooldown?: number;
  readonly run: CommandRunner<InGuild>;
}

export interface CommandHandlerConstructorData {
  readonly commandsDir?: string;
  readonly slashCommandsDir?: string;
  readonly developerIds?: string[];
  readonly prefix?: string;
  readonly suppressWarnings?: boolean;
  readonly messages?: CommandHandlerExceptionMessages;
  readonly maintenance?: boolean;
}

export interface CommandHandlerExceptionMessages {
  readonly cooldown?: string;
  readonly maintenance?: string;
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

export type SlashCommandRunner = (
  interaction: ChatInputCommandInteraction
) => Awaitable<unknown>;

export interface SlashCommandData {
  readonly slashCommandData: SlashCommandBuilderData;
  readonly developerOnly?: boolean;
  readonly maintenance?: boolean;
  readonly cooldown?: number;
  readonly run: SlashCommandRunner;
}
