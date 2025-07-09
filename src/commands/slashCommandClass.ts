import type {
  SlashCommandBuilderData,
  SlashCommandBuilders,
  SlashCommandData,
  SlashCommandRunner,
} from "./commandTypes";

import { SlashCommandBuilder } from "discord.js";
import { error } from "../helpers/logger";

export class SlashCommand {
  private data: SlashCommandData;

  constructor(data: SlashCommandData) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!data) error("Slash command data can not be undefined.");

    if (!("slashCommandData" in data)) {
      error("Slash command data must be given.");
    }

    if (
      !(data.slashCommandData instanceof SlashCommandBuilder) &&
      typeof data.slashCommandData !== "function"
    ) {
      error(
        "Slash command data must be a SlashCommandBuilder instance or a function."
      );
    }

    if ("developerOnly" in data && typeof data.developerOnly !== "boolean") {
      error("Slash command 'developer only' option must be a boolean.");
    }

    if ("maintenance" in data && typeof data.maintenance !== "boolean") {
      error("Slash command 'maintenance' option must be a boolean.");
    }

    if (
      "cooldown" in data ||
      typeof data.cooldown !== "number" ||
      data.cooldown <= 0
    ) {
      error("Slash command 'cooldown' must be a positive number.");
    }

    if (!("run" in data) || typeof data.run !== "function") {
      error("Slash command runner must be a function.");
    }

    this.data = data;
  }

  public convertCommandData(): SlashCommandBuilders {
    const commandData = this.data.slashCommandData;

    if (typeof commandData === "function") {
      const commandBuilder = commandData(new SlashCommandBuilder());

      if (!(commandBuilder instanceof SlashCommandBuilder)) {
        error("Converted slash command data is invalid.");
      }

      return commandBuilder;
    }

    return commandData;
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
