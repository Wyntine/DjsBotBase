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
    if (!data) error("Slash command data can not be undefifned.");

    if (!("slashCommandData" in data)) {
      error("Slash command data must be given.");
    }

    if (
      !(data.slashCommandData instanceof SlashCommandBuilder) &&
      typeof data.slashCommandData !== "function"
    ) {
      error("Slash command data must be a SlashCommandBuilder instance or a function.");
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

  get run(): SlashCommandRunner {
    return this.data.run;
  }
}
