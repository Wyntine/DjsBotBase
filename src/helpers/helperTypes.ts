export interface CooldownMapItem {
  commandType: CommandTypes;
  commandName: string;
  endsAt: number;
  messageShown: boolean;
}

export type EditCooldownMapItem = Partial<
  Omit<CooldownMapItem, "commandType" | "commandName">
>;

export type CommandTypes = "slash" | "message";
