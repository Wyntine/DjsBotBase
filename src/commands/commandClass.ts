import type { CommandData, CommandRunner } from "./commandTypes";
import { error, logWarn } from "../helpers/logger";

export class Command<InGuild extends boolean = boolean> {
  private readonly data: CommandData<InGuild>;

  constructor(data: CommandData<InGuild>) {
    this.validateConstructorData(data);
    this.data = data;
  }

  private validateConstructorData(data: CommandData<InGuild>): asserts data is NonNullable<CommandData<InGuild>> {
    this.validateName(data);
    this.validateAliases(data);
    this.validateBooleanOptions(data);
    this.validateCooldown(data);
    this.validateRunner(data);
  }

  private validateName(data: CommandData<InGuild>): void {
    if (!("name" in data) || typeof data.name !== "string" || !data.name.trim()) {
      error("Command name must be a non-empty string.");
    }
  }

  private validateAliases(data: CommandData<InGuild>): void {
    if ("aliases" in data && data.aliases !== undefined) {
      if (!Array.isArray(data.aliases)) {
        error("Command aliases must be an array of strings.");
      }

      const invalidAlias = data.aliases.find((alias: unknown) => typeof alias !== "string" || !String(alias).trim());
      if (invalidAlias !== undefined) {
        error("All command aliases must be non-empty strings.");
      }
    }
  }

  private validateBooleanOptions(data: CommandData<InGuild>): void {
    const booleanFields = ["guildOnly", "dmOnly", "developerOnly", "maintenance"] as const;
    
    for (const field of booleanFields) {
      if (field in data && data[field] !== undefined && typeof data[field] !== "boolean") {
        error(`Command '${field}' option must be a boolean.`);
      }
    }

    if (data.guildOnly === true && data.dmOnly === true) {
      logWarn(
        "Command set to both guild and DM only. This configuration has no effect - command can work everywhere."
      );
    }

    if (data.guildOnly === false && data.dmOnly === false) {
      logWarn(
        "Command explicitly set to both not guild-only and not DM-only. This is redundant - command can work everywhere."
      );
    }
  }

  private validateCooldown(data: CommandData<InGuild>): void {
    if ("cooldown" in data && data.cooldown !== undefined) {
      if (typeof data.cooldown !== "number" || !Number.isFinite(data.cooldown) || data.cooldown <= 0) {
        error("Command cooldown must be a positive finite number.");
      }
    }
  }

  private validateRunner(data: CommandData<InGuild>): void {
    if (!("run" in data) || typeof data.run !== "function") {
      error("Command runner must be a function.");
    }
  }

  get name(): string {
    return this.data.name;
  }

  get aliases(): readonly string[] {
    return Object.freeze(this.data.aliases ?? []);
  }

  get guildOnly(): boolean {
    return this.data.guildOnly ?? true;
  }

  get dmOnly(): boolean {
    return this.data.dmOnly ?? true;
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

  get run(): CommandRunner<InGuild> {
    return this.data.run;
  }
}
