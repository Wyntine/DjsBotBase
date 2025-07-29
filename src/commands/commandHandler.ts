import type {
  CommandHandlerConstructorData,
  CommandHandlerExceptionMessages,
  CommandMap,
  SlashCommandMap,
} from "./commandTypes";
import type {
  ApplicationCommandDataResolvable,
  Client,
  ChatInputCommandInteraction,
} from "discord.js";
import { Message, Interaction } from "discord.js";
import { SlashCommand } from "./slashCommandClass";
import { Command } from "./commandClass";
import { readdir } from "fs/promises";
import { error, logError, logInfo, logWarn } from "../helpers/logger";
import { addCooldown, checkCooldown, editCooldown } from "../helpers/cooldown";

export class CommandHandler {
  private readonly commandMap: CommandMap = new Map();
  private readonly slashCommandMap: SlashCommandMap = new Map();
  
  private readonly commandsDir: string;
  private readonly slashCommandsDir: string;
  private readonly developerIds: readonly string[];
  private readonly prefix: string;
  private readonly suppressWarnings: boolean;
  private readonly messages: CommandHandlerExceptionMessages;
  private readonly maintenance: boolean;

  private readonly commandRunner = (message: Message) => {
    this.runDefaultHandler(message);
  };

  private readonly slashCommandRunner = (interaction: Interaction) => {
    this.runDefaultSlashHandler(interaction);
  };

  constructor(data?: CommandHandlerConstructorData) {
    const config = this.validateAndNormalizeConfig(data);
    
    this.commandsDir = config.commandsDir;
    this.slashCommandsDir = config.slashCommandsDir;
    this.developerIds = Object.freeze(config.developerIds);
    this.prefix = config.prefix;
    this.suppressWarnings = config.suppressWarnings;
    this.messages = config.messages;
    this.maintenance = config.maintenance;
  }

  private validateAndNormalizeConfig(data?: CommandHandlerConstructorData) {
    const config = {
      commandsDir: "commands",
      slashCommandsDir: "slashCommands",
      developerIds: [] as string[],
      prefix: "",
      suppressWarnings: false,
      messages: {} as CommandHandlerExceptionMessages,
      maintenance: false,
    };

    if (!data) return config;

    if ("commandsDir" in data) {
      if (typeof data.commandsDir !== "string") {
        error("commandsDir must be a string.");
      }
      config.commandsDir = data.commandsDir;
    }

    if ("slashCommandsDir" in data) {
      if (typeof data.slashCommandsDir !== "string") {
        error("slashCommandsDir must be a string.");
      }
      config.slashCommandsDir = data.slashCommandsDir;
    }

    if ("developerIds" in data) {
      if (!Array.isArray(data.developerIds)) {
        error("developerIds must be a string array.");
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const invalidId = data.developerIds.find(id => typeof id !== "string");
      if (invalidId !== undefined) {
        error("All developer IDs must be strings.");
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      config.developerIds = [...data.developerIds];
    }

    if ("prefix" in data) {
      if (typeof data.prefix !== "string") {
        error("prefix must be a string.");
      }
      config.prefix = data.prefix;
    }

    if ("suppressWarnings" in data) {
      if (typeof data.suppressWarnings !== "boolean") {
        error("suppressWarnings must be a boolean.");
      }
      config.suppressWarnings = data.suppressWarnings;
    }

    if ("messages" in data) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!data.messages || typeof data.messages !== "object" || Array.isArray(data.messages)) {
        error("messages must be an object.");
      }

      this.validateMessages(data.messages);
      config.messages = { ...data.messages };
    }

    if ("maintenance" in data) {
      if (typeof data.maintenance !== "boolean") {
        error("maintenance must be a boolean.");
      }
      config.maintenance = data.maintenance;
    }

    return config;
  }

  private validateMessages(messages: CommandHandlerExceptionMessages): void {
    const validMessageKeys = ["cooldown", "maintenance"] as const;
    
    for (const key of validMessageKeys) {
      if (key in messages) {
        const message = messages[key];
        if (typeof message !== "string") {
          error(`messages.${key} must be a string.`);
        }
      }
    }
  }

  public async setCommands(): Promise<void> {
    try {
      await this.loadCommandsFromDirectory();
    } catch (error) {
      logError("Failed to set commands!");
      console.error(error);
    }
  }

  private async loadCommandsFromDirectory(): Promise<void> {
    const normalizedDir = this.normalizeDirectoryPath(this.commandsDir);
    const commandFiles = await this.getValidCommandFiles(normalizedDir);
    
    logInfo("Reading commands...");
    
    let loadedCount = 0;
    
    for (const fileName of commandFiles) {
      try {
        const command = await this.loadCommandFromFile(normalizedDir, fileName);
        if (command && this.validateAndAddCommand(command, fileName)) {
          loadedCount++;
        }
      } catch (error) {
        logError(`Failed to load command '${fileName}'!`);
        console.error(error);
      }
    }

    logInfo(`${loadedCount.toString()} ${loadedCount === 1 ? "command" : "commands"} registered.`);
  }

  private async getValidCommandFiles(directory: string): Promise<string[]> {
    const dirents = await readdir(directory, { withFileTypes: true });
    return dirents
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name)
      .filter(name => this.isValidScriptFile(name, "command"));
  }

  private isValidScriptFile(fileName: string, type: "command" | "slash command"): boolean {
    const fileRegex = /^[\w\s]+\.(js|ts)$/;
    
    if (!fileRegex.test(fileName)) {
      if (!this.suppressWarnings) {
        logWarn(`'${fileName}' is not a valid JavaScript/TypeScript file for ${type}.`);
      }
      return false;
    }
    
    return true;
  }

  private async loadCommandFromFile(directory: string, fileName: string): Promise<Command | null> {
    const commandPath = `../../../../${directory}/${fileName}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const commandModule = await import(commandPath);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const commandData = commandModule?.default;

    if (!commandData) {
      if (!this.suppressWarnings) {
        logWarn(`'${fileName}' does not have a default export.`);
      }
      return null;
    }

    if (!(commandData instanceof Command)) {
      if (!this.suppressWarnings) {
        logWarn(`'${fileName}' does not export a Command instance as default.`);
      }
      return null;
    }

    return commandData;
  }

  private validateAndAddCommand(command: Command, fileName: string): boolean {
    if (this.getCommandOrAliases(command.name)) {
      if (!this.suppressWarnings) {
        logWarn(`Command '${command.name}' from '${fileName}' already exists.`);
      }
      return false;
    }

    const conflictingAlias = command.aliases.find(alias => this.getCommandOrAliases(alias));
    if (conflictingAlias) {
      if (!this.suppressWarnings) {
        logWarn(`Command '${command.name}' has conflicting alias '${conflictingAlias}'.`);
      }
      return false;
    }

    this.commandMap.set(command.name, command);
    logInfo(`Command '${fileName}' (${command.name}) loaded successfully.`);
    return true;
  }

  public async setSlashCommands(): Promise<void> {
    try {
      await this.loadSlashCommandsFromDirectory();
    } catch (error) {
      logError("Failed to set slash commands!");
      console.error(error);
    }
  }

  private async loadSlashCommandsFromDirectory(): Promise<void> {
    const normalizedDir = this.normalizeDirectoryPath(this.slashCommandsDir);
    const slashCommandFiles = await this.getValidSlashCommandFiles(normalizedDir);
    
    logInfo("Reading slash commands...");
    
    let loadedCount = 0;
    
    for (const fileName of slashCommandFiles) {
      try {
        const slashCommand = await this.loadSlashCommandFromFile(normalizedDir, fileName);
        if (slashCommand && this.validateAndAddSlashCommand(slashCommand, fileName)) {
          loadedCount++;
        }
      } catch (error) {
        logError(`Failed to load slash command '${fileName}'!`);
        console.error(error);
      }
    }

    logInfo(`${loadedCount.toString()} slash ${loadedCount === 1 ? "command" : "commands"} registered.`);
  }

  private async getValidSlashCommandFiles(directory: string): Promise<string[]> {
    const dirents = await readdir(directory, { withFileTypes: true });
    return dirents
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name)
      .filter(name => this.isValidScriptFile(name, "slash command"));
  }

  private async loadSlashCommandFromFile(directory: string, fileName: string): Promise<SlashCommand | null> {
    const slashCommandPath = `../../../../${directory}/${fileName}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const slashCommandModule = await import(slashCommandPath);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const slashCommandData = slashCommandModule?.default;

    if (!slashCommandData) {
      if (!this.suppressWarnings) {
        logWarn(`'${fileName}' does not have a default export.`);
      }
      return null;
    }

    if (!(slashCommandData instanceof SlashCommand)) {
      if (!this.suppressWarnings) {
        logWarn(`'${fileName}' does not export a SlashCommand instance as default.`);
      }
      return null;
    }

    return slashCommandData;
  }

  private validateAndAddSlashCommand(slashCommand: SlashCommand, fileName: string): boolean {
    const builderData = slashCommand.convertCommandData();
    const commandName = builderData.name;

    if (typeof commandName !== "string" || !commandName.trim()) {
      if (!this.suppressWarnings) {
        logWarn(`'${fileName}' has no valid name set in its builder.`);
      }
      return false;
    }

    this.slashCommandMap.set(commandName, slashCommand);
    logInfo(`Slash command '${fileName}' (${commandName}) loaded successfully.`);
    return true;
  }

  private normalizeDirectoryPath(directory: string): string {
    return directory.startsWith("./") ? directory : `./${directory}`;
  }

  public runDefaultHandler(message: Message, prefixOverride?: string): void {
    const actualPrefix = prefixOverride ?? this.prefix;
    
    if (!this.shouldProcessMessage(message, actualPrefix)) {
      return;
    }

    const commandInfo = this.parseCommand(message.content, actualPrefix);
    if (!commandInfo) {
      return;
    }

    const { commandName, args } = commandInfo;
    const command = this.getCommandOrAliases(commandName);
    
    if (!command) {
      return;
    }

    if (!this.isCommandExecutableInContext(command, message)) {
      return;
    }

    if (!this.handleCooldown(message.author.id, command, message)) {
      return;
    }

    if (!this.handleMaintenance(command, message.author.id, message)) {
      return;
    }

    if (!this.handleDeveloperOnly(command, message.author.id)) {
      return;
    }

    addCooldown(message.author.id, command);
    command.run(message, args);
  }

  private shouldProcessMessage(message: Message, prefix: string): boolean {
    if (message.author.bot) {
      return false;
    }

    if (typeof prefix !== "string") {
      error("Command handler prefix is not set!");
    }

    return message.content.startsWith(prefix);
  }

  private parseCommand(content: string, prefix: string): { commandName: string; args: string[] } | null {
    const withoutPrefix = content.slice(prefix.length);
    const parts = withoutPrefix.split(" ");
    const commandName = parts[0];

    if (!commandName) {
      return null;
    }

    return {
      commandName,
      args: parts.slice(1),
    };
  }

  private isCommandExecutableInContext(command: Command, message: Message): boolean {
    const isInGuild = Boolean(message.guild);
    
    if (command.dmOnly && isInGuild) {
      return false;
    }
    
    if (command.guildOnly && !isInGuild) {
      return false;
    }

    return true;
  }

  private handleCooldown(userId: string, command: Command | SlashCommand, context: Message | ChatInputCommandInteraction): boolean {
    const [cooldownItem, isValid] = checkCooldown(userId, command);

    if (cooldownItem && !isValid) {
      if (cooldownItem.messageShown) {
        return false;
      }

      const secondsLeft = Math.ceil((cooldownItem.endsAt - Date.now()) / 1000);
      const errorMessage = (
        this.messages.cooldown ?? 
        "Bu komutu kullanmak için **{cooldown}** saniye bekleyiniz."
      ).replace("{cooldown}", secondsLeft.toString());

      void context.reply(errorMessage);
      
      editCooldown(userId, command, { messageShown: true });
      return false;
    }

    return true;
  }

  private handleMaintenance(command: Command | SlashCommand, userId: string, context: Message | ChatInputCommandInteraction): boolean {
    if ((this.maintenance || command.maintenance) && !this.developerIds.includes(userId)) {
      const errorMessage = this.messages.maintenance ?? "Bu komut bakımdadır.";

      void context.reply(errorMessage);
      
      addCooldown(userId, command, 5);
      return false;
    }

    return true;
  }

  private handleDeveloperOnly(command: Command | SlashCommand, userId: string): boolean {
    return !command.developerOnly || this.developerIds.includes(userId);
  }

  public runDefaultSlashHandler(interaction: Interaction): void {
    if (!this.shouldProcessInteraction(interaction)) {
      return;
    }

    const chatInteraction = interaction as ChatInputCommandInteraction;
    const commandName = chatInteraction.commandName;
    const command = this.getSlashCommand(commandName);

    if (!command) {
      return;
    }

    if (!this.handleCooldown(chatInteraction.user.id, command, chatInteraction)) {
      return;
    }

    if (!this.handleMaintenance(command, chatInteraction.user.id, chatInteraction)) {
      return;
    }

    if (!this.handleDeveloperOnly(command, chatInteraction.user.id)) {
      return;
    }

    addCooldown(chatInteraction.user.id, command);
    command.run(chatInteraction);
  }

  private shouldProcessInteraction(interaction: Interaction): boolean {
    return !interaction.user.bot && interaction.isChatInputCommand();
  }

  public setDefaultHandler(client: Client): this {
    if (!this.suppressWarnings) {
      logWarn(
        [
          "You are using the default command handler included in this package.",
          "This may cause unexpected errors or restrict you when modifying the command handler.",
          "For example, you cannot change your bot's prefix per server!",
          "We recommend using '<CommandHandler>.runDefaultHandler(<Message>, <string?>)' in an event for more flexibility.",
          "You can ignore this message by setting 'suppressWarnings' to true in the handler constructor.",
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
          "Commands will not be detected by the bot.",
        ].join("\n")
      );
    }

    client.removeListener("messageCreate", this.commandRunner);
    return this;
  }

  public setDefaultSlashHandler(client: Client): this {
    if (!this.suppressWarnings) {
      logWarn(
        [
          "You are using the default slash command handler included in this package.",
          "This may cause unexpected errors or restrict you when modifying the slash command handler.",
          "We recommend using '<CommandHandler>.runDefaultSlashHandler(<Interaction>)' in an event for more flexibility.",
          "You can ignore this message by setting 'suppressWarnings' to true in the handler constructor.",
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
          "Slash commands will not be detected by the bot.",
        ].join("\n")
      );
    }

    client.removeListener("interactionCreate", this.slashCommandRunner);
    return this;
  }

  public getCommand(commandName: string): Command | undefined {
    return this.commandMap.get(commandName);
  }

  public getCommands(): Command[] {
    return Array.from(this.commandMap.values());
  }

  public getCommandOrAliases(commandOrAliasName: string): Command | undefined {
    return Array.from(this.commandMap.values()).find(command =>
      [command.name, ...command.aliases].includes(commandOrAliasName)
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

  public getSlashCommands(): SlashCommand[] {
    return Array.from(this.slashCommandMap.values());
  }

  public getSlashCommand(slashCommandName: string): SlashCommand | undefined {
    return this.slashCommandMap.get(slashCommandName);
  }

  public clearSlashCommands(): this {
    this.slashCommandMap.clear();
    return this;
  }

  public async registerSlashCommands(client: Client, guildId?: string): Promise<void> {
    const commandList = Array.from(this.slashCommandMap.values())
      .map(command => command.convertCommandData()) as ApplicationCommandDataResolvable[];

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
