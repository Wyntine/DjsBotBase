export interface CooldownMapItem {
  readonly commandType: CommandTypes;
  readonly commandName: string;
  readonly endsAt: number;
  readonly messageShown: boolean;
}

export type EditCooldownMapItem = Partial<
  Pick<CooldownMapItem, "endsAt" | "messageShown">
>;

export type CommandTypes = "slash" | "message";
