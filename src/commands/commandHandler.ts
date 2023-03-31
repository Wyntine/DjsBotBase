import type { CommandHandlerConstructorData, CommandMap } from "./commandTypes";
import type { Client, Message } from "discord.js";

import { Command } from "./commandClass";
import { readdir } from "fs/promises";
import { error, logError, logInfo, logWarn } from "../helpers/logger";

export class CommandHandler {
  private commandMap: CommandMap = new Map();
  private commandsDir: string = "commands";
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

          const fileRegex = /^(\w|\s)+.js$/;

          if (!fileRegex.test(name)) {
            if (!this.suppressWarnings) logWarn(`'${name}' is not a JavaScript file.`);
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

        logInfo(
          `${this.commandMap.size} ${
            this.commandMap.size === 1 ? "command" : "commands"
          } registered.`
        );
      }
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

  public clearCommands(): void {
    this.commandMap.clear();
  }

  public removeCommand(commandName: string): void {
    this.commandMap.delete(commandName);
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

  public setDefaultHandler(client: Client): void {
    if (!this.suppressWarnings) {
      logWarn(
        [
          "You are using the default command handler which is included in this package.",
          "> That can cause unexpected errors or restrict you when modifying command handler.",
          "-> For example you can not change your bot's prefix in servers!",
          "> We recommend you to use '<CommandHandler>.runDefaultHandler(<Message>, <string?>)' in an event to be more flexible in your code.",
          "> You can ignore this message if you know what you are doing by setting 'suppressWarnings' in handler constructor.",
        ].join("\n")
      );
    }
    client.on("messageCreate", (message) => this.runDefaultHandler(message));
  }
}
