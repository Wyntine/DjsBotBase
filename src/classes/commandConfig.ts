import { CommandConfigData, CommandTypes } from "@/types/commands.js";
import { InteractionContextType } from "discord.js";

export class CommandConfig<Type extends CommandTypes> {
  public readonly type: Type;
  public readonly enabled: boolean;
  public readonly cooldown: number;
  // TODO: Add this while registering slash commands and check it inside message command handler
  public readonly accessAreas: readonly InteractionContextType[];
  public readonly developerOnly: boolean;
  public readonly maintenance: boolean;
  public readonly requiredUserPermissions: readonly bigint[];
  public readonly requiredBotPermissions: readonly bigint[];
  public readonly guildWhitelist: readonly string[];

  constructor(options: CommandConfigData<Type> = {}) {
    this.type = (options.type ?? CommandTypes.Combined) as Type;
    this.enabled = options.enabled ?? true;
    // TODO: Add command cooldown check after importing the command (in the handler)
    this.cooldown = options.cooldown ?? 0;
    this.accessAreas = options.accessAreas ?? [
      InteractionContextType.BotDM,
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ];
    this.developerOnly = options.developerOnly ?? false;
    this.maintenance = options.maintenance ?? false;
    this.requiredUserPermissions = options.requiredUserPermissions ?? [];
    this.requiredBotPermissions = options.requiredBotPermissions ?? [];
    this.guildWhitelist = options.guildWhitelist ?? [];
  }
}

// private doCommandTypeConditional<
//   IfSlash,
//   IfMessage,
//   IfCombined = IfSlash | IfMessage,
// >(
//   ifSlash: IfSlash,
//   ifMessage: IfMessage,
//   ifCombined?: IfCombined
// ): CommandTypeConditional<Options, IfSlash, IfMessage, IfCombined> {
//   return ifCombined !== undefined && this.isCombined() ? ifCombined : this.canUseSlash() ?
// }
