import type { CommandData, CommandRunner } from "./commandTypes";

import { error, logWarn } from "../helpers/logger";

export class Command<InGuild extends boolean = boolean> {
  private data: CommandData<InGuild>;

  constructor(data: CommandData<InGuild>) {
    this.verifyDataType(data);
    this.verifyName(data);
    this.verifyAliases(data);
    this.verifyGuildOnly(data);
    this.verifyDmOnly(data);
    this.verifyCommandFlags(data);
    this.verifyDeveloperOnly(data);
    this.verifyMaintenance(data);
    this.verifyCooldown(data);
    this.verifyCommandRunner(data);

    this.data = data;
  }

  get name(): string {
    return this.data.name;
  }

  get aliases(): string[] {
    return this.data.aliases ?? [];
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

  //* Verifiers

  private verifyDataType(
    data: unknown
  ): asserts data is Record<string, unknown> {
    if (!data) error("Command data cannot be empty.");
    if (typeof data !== "object" || Array.isArray(data))
      error("Command data must be a key-value pair object.");
  }

  private verifyName(data: CommandData<InGuild>) {
    if (!("name" in data) || typeof data.name !== "string") {
      error("Command name must be given.");
    }
  }

  private verifyAliases(data: CommandData<InGuild>) {
    if ("aliases" in data) {
      if (
        !Array.isArray(data.aliases) ||
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-confusing-void-expression
        data.aliases.find((alias) => typeof alias !== "string")
      )
        error("Command aliases must be an string array.");
    }
  }

  private verifyGuildOnly(data: CommandData<InGuild>) {
    if ("guildOnly" in data && typeof data.guildOnly !== "boolean") {
      error("Command 'guild only' option must be a boolean.");
    }
  }

  private verifyDmOnly(data: CommandData<InGuild>) {
    if ("dmOnly" in data && typeof data.dmOnly !== "boolean") {
      error("Command 'DM only' option must be a boolean.");
    }
  }

  private verifyCommandFlags(data: CommandData<InGuild>) {
    if (data.guildOnly === true && data.dmOnly === true) {
      logWarn(
        "Command set to both guild and DM only (same as not setting two values). Command can work in everywhere."
      );
    }

    if (data.guildOnly === false && data.dmOnly === false) {
      logWarn(
        "Command set to both not guild and not DM only (same as not setting two values). Command can work in everywhere."
      );
    }
  }

  private verifyDeveloperOnly(data: CommandData<InGuild>) {
    if ("developerOnly" in data && typeof data.developerOnly !== "boolean") {
      error("Command 'developer only' option must be a boolean.");
    }
  }

  private verifyMaintenance(data: CommandData<InGuild>) {
    if ("maintenance" in data && typeof data.maintenance !== "boolean") {
      error("Command 'maintenance' option must be a boolean.");
    }
  }

  private verifyCooldown(data: CommandData<InGuild>) {
    if (
      "cooldown" in data &&
      (typeof data.cooldown !== "number" || data.cooldown <= 0)
    ) {
      error("Command 'cooldown' must be a positive number.");
    }
  }

  private verifyCommandRunner(data: CommandData<InGuild>) {
    if (!("run" in data) || typeof data.run !== "function") {
      error("Command runner must be a function.");
    }
  }
}
