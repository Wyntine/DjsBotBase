import type { CommandHandlerConstructorData, CommandMap, SlashCommandMap } from "./commandTypes";
import type { ApplicationCommandDataResolvable, Client, Interaction, Message } from "discord.js";

import { SlashCommand } from "./slashCommandClass";
import { Command } from "./commandClass";
import { readdir } from "fs/promises";
import { error, logError, logInfo, logWarn } from "../helpers/logger";

export class CommandHandler {
  private commandMap: CommandMap = new Map();
  private commandsDir: string = "commands";
  private commandRunner = (message: Message) => this.runDefaultHandler(message);

  private slashCommandMap: SlashCommandMap = new Map();
  private slashCommandsDir: string = "slashCommands";
  private slashCommandRunner = (interaction: Interaction) =>
    this.runDefaultSlashHandler(interaction);

  private developerIds: string[] = [];
  private prefix!: string;
  private suppressWarnings: boolean = false;

  constructor(data?: CommandHandlerConstructorData) {
    if (!data) return;

    if ("commandsDir" in data) {
      if (typeof data.commandsDir !== "string") {
        error("'commandsDir' must be a string.");
      }

      this.commandsDir = data.commandsDir;
    }

    if ("slashCommandsDir" in data) {
      if (typeof data.slashCommandsDir !== "string") {
        error("'slashCommandsDir' must be a string.");
      }

      this.slashCommandsDir = data.slashCommandsDir;
    }

    if ("developerIds" in data) {
      if (!Array.isArray(data.developerIds)) {
        error("'developerIds' must be a string array.");
      }

      if (data.developerIds.find((developer) => typeof developer !== "string")) {
        error("'developerIds' has an id that is not a string.");
      }

      this.developerIds = data.developerIds;
    }

    if ("prefix" in data) {
      if (typeof data.prefix !== "string") {
        error("'prefix' must be a string.");
      }

      this.prefix = data.prefix;
    }

    if ("suppressWarnings" in data) {
      if (typeof data.suppressWarnings !== "boolean") {
        error("'suppressWarnings' must be a boolean.");
      }

      if (data.suppressWarnings === true) {
        logWarn("Warnings from command handler is suppressed.");
      }

      this.suppressWarnings = data.suppressWarnings;
    }
  }

  //* Normal commands

  public async setCommands(): Promise<void> {
    const { commandsDir } = this;

    try {
      const newCommandsDir = commandsDir.startsWith("./") ? commandsDir : `./${commandsDir}`;
      const commands = await readdir(newCommandsDir, { withFileTypes: true });

      logInfo("Reading commands...");

      for (const command of commands) {
        const { name } = command;

        try {
          if (!command.isFile()) {
            if (!this.suppressWarnings) logWarn(`'${name}' is not a file.`);
            continue;
          }

          const fileRegex = /^(\w|\s)+.(js|ts)$/;

          if (!fileRegex.test(name)) {
            if (!this.suppressWarnings) logWarn(`'${name}' is not a JavaScript/TypeScript file.`);
            continue;
          }

          const commandPath = `../../../../${newCommandsDir}/${name}`;
          const commandData = ((await import(commandPath)) ?? {}).default;

          if (!commandData) {
            if (!this.suppressWarnings) logWarn(`'${name}' does not have an default export.`);
            continue;
          }

          if (!(commandData instanceof Command)) {
            if (!this.suppressWarnings) {
              logWarn(`'${name}' does not have default export of Command instance.`);
            }
            continue;
          }

          if (this.getCommandOrAliases(commandData.name)) {
            if (!this.suppressWarnings) logWarn(`'${name}' named '${commandData.name}' exists.`);
            continue;
          }

          if (commandData.aliases.find((alias) => this.getCommandOrAliases(alias))) {
            if (!this.suppressWarnings) {
              logWarn(
                `'${name}' named '${commandData.name}' have an alias that exist on another command.`
              );
            }
            continue;
          }

          this.commandMap.set(commandData.name, commandData);
          logInfo(`Command file '${name}' (${commandData.name}) loaded.`);
        } catch (innerError) {
          logError(`Reading command '${name}' failed!`);
          console.error(innerError);
        }
      }

      logInfo(
        `${this.commandMap.size} ${this.commandMap.size === 1 ? "command" : "commands"} registered.`
      );
    } catch (outerError) {
      logError("Reading commands failed!");
      console.error(outerError);
    }
  }

  public getCommand(commandName: string): Command | undefined {
    return this.commandMap.get(commandName);
  }

  public getCommandOrAliases(commandOrAliasName: string): Command | undefined {
    return Array.from(this.commandMap.values()).find(({ name, aliases }) =>
      [name, ...aliases].includes(commandOrAliasName)
    );
  }

  public clearCommands(): this {
    this.commandMap.clear();
    return this;
  }

  public removeCommand(commandName: string): this {
    this.commandMap.delete(commandName);
    return this;
  }

  public async runDefaultHandler(message: Message, prefix: string = this.prefix): Promise<void> {
    const author = message.author;

    if (author.bot) return;

    if (typeof prefix !== "string") error("Command handler prefix is not set!");

    const content = message.content;

    if (!content.startsWith(prefix)) return;

    const base = content.slice(prefix.length).split(" ");
    const commandName = base[0];

    if (!commandName) return;

    const command = this.getCommandOrAliases(commandName);

    if (
      !command ||
      (!(command.dmOnly === true && command.guildOnly === true) &&
        ((command.dmOnly && message.guild) || (command.guildOnly && !message.guild))) ||
      (command.developerOnly && !this.developerIds.includes(author.id))
    ) {
      return;
    }

    const args = base.slice(1);
    command.run(message, args);
  }

  public setDefaultHandler(client: Client): this {
    if (!this.suppressWarnings) {
      logWarn(
        [
          "You are using the default command handler which is included in this package.",
          "> That can cause unexpected errors or restrict you when modifying command handler.",
          "-> For example you can not change your bot's prefix in servers!",
          "> We recommend you to use '<CommandHandler>.runDefaultHandler(<Message>, <string?>)' in an event to be more flexible in your code.",
          "> You can ignore this message if you know what you are doing by setting 'suppressWarnings' to true in handler constructor.",
        ].join("\n")
      );
    }

    client.on("messageCreate", this.commandRunner);
    return this;
  }

  public removeDefaultHandler(client: Client): this {
    if (!this.suppressWarnings) {
      logWarn(
        [
          "Default command handler removed from the bot.",
          "> Commands will not detected by the bot.",
        ].join("\n")
      );
    }

    client.removeListener("messageCreate", this.commandRunner);
    return this;
  }

  //* Slash commands

  public async setSlashCommands(): Promise<void> {
    const { slashCommandsDir } = this;

    try {
      const newSlashCommandsDir = slashCommandsDir.startsWith("./")
        ? slashCommandsDir
        : `./${slashCommandsDir}`;
      const slashCommands = await readdir(newSlashCommandsDir, { withFileTypes: true });

      logInfo("Reading slash commands...");

      for (const slashCommand of slashCommands) {
        const { name } = slashCommand;

        try {
          if (!slashCommand.isFile()) {
            if (!this.suppressWarnings) logWarn(`'${name}' is not a file.`);
            continue;
          }

          const fileRegex = /^(\w|\s)+.(js|ts)$/;

          if (!fileRegex.test(name)) {
            if (!this.suppressWarnings) logWarn(`'${name}' is not a JavaScript/TypeScript file.`);
            continue;
          }

          const slashCommandPath = `../../../../${newSlashCommandsDir}/${name}`;
          const slashCommandData = ((await import(slashCommandPath)) ?? {}).default;

          if (!slashCommandData) {
            if (!this.suppressWarnings) logWarn(`'${name}' does not have an default export.`);
            continue;
          }

          if (!(slashCommandData instanceof SlashCommand)) {
            if (!this.suppressWarnings) {
              logWarn(`'${name}' does not have default export of SlashCommand instance.`);
            }
            continue;
          }

          const slashCommandBuilderData = slashCommandData.convertCommandData();
          const builderName = slashCommandBuilderData.name;

          if (typeof builderName !== "string") {
            if (!this.suppressWarnings) logWarn(`'${name}' has no name set in its builder.`);
            continue;
          }

          this.slashCommandMap.set(builderName, slashCommandData);
          logInfo(`Slash command file '${name}' (${builderName}) loaded.`);
        } catch (innerError) {
          logError(`Reading slash command '${name}' failed!`);
          console.error(innerError);
        }
      }

      logInfo(
        `${this.slashCommandMap.size} slash ${
          this.slashCommandMap.size === 1 ? "command" : "commands"
        } registered.`
      );
    } catch (outerError) {
      logError("Reading slash commands failed!");
      console.error(outerError);
    }
  }

  public async runDefaultSlashHandler(interaction: Interaction): Promise<void> {
    const user = interaction.user;

    if (user.bot || !interaction.isCommand()) return;

    const name = interaction.commandName;
    const command = this.getSlashCommand(name);

    if (!command) return;

    command.run(interaction);
  }

  public setDefaultSlashHandler(client: Client): this {
    if (!this.suppressWarnings) {
      logWarn(
        [
          "You are using the default slash command handler which is included in this package.",
          "> That can cause unexpected errors or restrict you when modifying slash command handler.",
          "> We recommend you to use '<CommandHandler>.runDefaultSlashHandler(<Interaction>)' in an event to be more flexible in your code.",
          "> You can ignore this message if you know what you are doing by setting 'suppressWarnings' to true in handler constructor.",
        ].join("\n")
      );
    }

    client.on("interactionCreate", this.slashCommandRunner);
    return this;
  }

  public removeDefaultSlashHandler(client: Client): this {
    if (!this.suppressWarnings) {
      logWarn(
        [
          "Default slash command handler removed from the bot.",
          "> Slash commands will not detected by the bot.",
        ].join("\n")
      );
    }

    client.removeListener("interactionCreate", this.slashCommandRunner);
    return this;
  }

  public getSlashCommand(slashCommandName: string): SlashCommand | undefined {
    return this.slashCommandMap.get(slashCommandName);
  }

  public clearSlashCommands(): this {
    this.slashCommandMap.clear();
    return this;
  }

  public async registerSlashCommands(client: Client, guildId?: string): Promise<void> {
    const commandList = Array.from(this.slashCommandMap.values()).map((command) =>
      command.convertCommandData()
    ) as ApplicationCommandDataResolvable[];

    if (typeof guildId === "string") {
      await client.application?.commands.set(commandList, guildId);
    } else {
      await client.application?.commands.set(commandList);
    }
  }

  public removeSlashCommand(slashCommandName: string): this {
    this.slashCommandMap.delete(slashCommandName);
    return this;
  }
}
