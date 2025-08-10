export interface CooldownMapItem {
  readonly commandType: CommandTypes;
  readonly commandName: string;
  readonly endsAt: number;
  readonly messageLastShown?: number | undefined;
}

export type EditCooldownMapItem = Partial<
  Omit<CooldownMapItem, "commandType" | "commandName">
>;

export type CommandTypes = "slash" | "message";
