import { InteractionContextType } from "discord.js";

export enum CommandTypes {
  Slash,
  Message,
  Combined,
}

export type CommandTypeConditional<
  Type extends CommandTypes,
  IfSlash,
  IfMessage,
  IfCombined = IfSlash | IfMessage,
> = Type extends CommandTypes.Slash
  ? IfSlash
  : Type extends CommandTypes.Message
    ? IfMessage
    : IfCombined;

export interface CommandConfigData<
  Type extends CommandTypes = CommandTypes.Combined,
> {
  readonly type?: Type;
  readonly enabled?: boolean;
  readonly cooldown?: number;
  readonly accessAreas?: readonly InteractionContextType[];
  readonly developerOnly?: boolean;
  readonly maintenance?: boolean;
  readonly requiredUserPermissions?: bigint[];
  readonly requiredBotPermissions?: bigint[];
  readonly guildWhitelist?: string[];
}

export interface CommandData<Type extends CommandTypes> {
  config?: CommandConfigData<Type>;
}
