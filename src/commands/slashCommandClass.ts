import type {
  SlashCommandBuilderData,
  SlashCommandBuilders,
  SlashCommandData,
  SlashCommandRunner,
} from "./commandTypes";
import { SlashCommandBuilder } from "discord.js";
import { error } from "../helpers/logger";

export class SlashCommand {
  private readonly data: SlashCommandData;

  constructor(data: SlashCommandData) {
    this.validateConstructorData(data);
    this.data = data;
  }

  private validateConstructorData(data: SlashCommandData): asserts data is NonNullable<SlashCommandData> {
    this.validateSlashCommandData(data);
    this.validateBooleanOptions(data);
    this.validateCooldown(data);
    this.validateRunner(data);
  }

  private validateSlashCommandData(data: SlashCommandData): void {
    if (!("slashCommandData" in data) || !data.slashCommandData) {
      error("Slash command data must be provided.");
    }

    if (
      !(data.slashCommandData instanceof SlashCommandBuilder) &&
      typeof data.slashCommandData !== "function"
    ) {
      error(
        "Slash command data must be a SlashCommandBuilder instance or a function that returns one."
      );
    }
  }

  private validateBooleanOptions(data: SlashCommandData): void {
    const booleanFields = ["developerOnly", "maintenance"] as const;
    
    for (const field of booleanFields) {
      if (field in data && data[field] !== undefined && typeof data[field] !== "boolean") {
        error(`Slash command '${field}' option must be a boolean.`);
      }
    }
  }

  private validateCooldown(data: SlashCommandData): void {
    if ("cooldown" in data && data.cooldown !== undefined) {
      if (typeof data.cooldown !== "number" || !Number.isFinite(data.cooldown) || data.cooldown <= 0) {
        error("Slash command cooldown must be a positive finite number.");
      }
    }
  }

  private validateRunner(data: SlashCommandData): void {
    if (!("run" in data) || typeof data.run !== "function") {
      error("Slash command runner must be a function.");
    }
  }

  public convertCommandData(): SlashCommandBuilders {
    const { slashCommandData } = this.data;

    if (typeof slashCommandData === "function") {
      const commandBuilder = slashCommandData(new SlashCommandBuilder());

      if (!(commandBuilder instanceof SlashCommandBuilder)) {
        error("Slash command data function must return a valid SlashCommandBuilder instance.");
      }

      return commandBuilder;
    }

    return slashCommandData;
  }

  get slashCommandData(): SlashCommandBuilderData {
    return this.data.slashCommandData;
  }

  get developerOnly(): boolean {
    return this.data.developerOnly ?? false;
  }

  get maintenance(): boolean {
    return this.data.maintenance ?? false;
  }

  get cooldown(): number {
    return this.data.cooldown ?? -1;
  }

  get run(): SlashCommandRunner {
    return this.data.run;
  }
}
