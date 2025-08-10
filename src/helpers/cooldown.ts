import { SlashCommand } from "../commands/slashCommandClass";
import {
  CommandTypes,
  CooldownMapItem,
  EditCooldownMapItem,
} from "./helperTypes";
import { Command } from "../commands/commandClass";
import {
  ONE_HOUR_IN_MILISECONDS,
  ONE_SECOND_IN_MILISECONDS,
} from "./constants";

const cooldowns = new Map<string, CooldownMapItem[]>();

let cooldownClearInterval: NodeJS.Timeout | undefined;

export function startCooldownClearJob(): void {
  if (cooldownClearInterval) disableCooldownClearJob();

  cooldownClearInterval = setInterval(
    clearExpiredCooldowns,
    ONE_HOUR_IN_MILISECONDS
  );
}

export function disableCooldownClearJob(): void {
  clearInterval(cooldownClearInterval);
  cooldownClearInterval = undefined;
}

export function clearExpiredCooldowns() {
  const now = Date.now();

  for (const [userId, userCooldowns] of cooldowns) {
    const finalUserCooldowns = userCooldowns.filter(
      (cooldown) => now > cooldown.endsAt
    );

    if (finalUserCooldowns.length === userCooldowns.length) continue;

    cooldowns.set(userId, finalUserCooldowns);
  }
}

export function canMessageShownAgain(
  cooldownItem: CooldownMapItem,
  messageCooldownInSeconds: number
): boolean {
  const { messageLastShown = undefined } = cooldownItem;

  const isValueValid =
    messageLastShown !== undefined &&
    Number.isSafeInteger(messageLastShown) &&
    messageLastShown > 0;

  const isCooldownExpired =
    isValueValid &&
    Date.now() >=
      messageLastShown + messageCooldownInSeconds * ONE_SECOND_IN_MILISECONDS;

  return !isValueValid || isCooldownExpired;
}

export function isCooldownAppliable(
  userId: string,
  command: Command | SlashCommand
): [CooldownMapItem | undefined, boolean] {
  const cooldownItem = getCooldown(userId, command);

  const isItemAvailable = !!cooldownItem;
  const hasValidCooldownValue =
    Number.isInteger(command.cooldown) && command.cooldown > 0;
  const isItemEnded = isItemAvailable && Date.now() > cooldownItem.endsAt;
  const hasItemAndSuitableState = isItemAvailable && isItemEnded;

  const result =
    hasValidCooldownValue && (!isItemAvailable || hasItemAndSuitableState);

  return [cooldownItem, result];
}

export function addCooldown(
  userId: string,
  command: SlashCommand | Command,
  cooldownOverride?: number
): void {
  if (Number.isInteger(command.cooldown) && command.cooldown <= 0) return;

  const cooldownItem = createCooldown(command, cooldownOverride);
  setCooldown(userId, cooldownItem);
}

export function createCooldown(
  command: Command | SlashCommand,
  cooldownOverride?: number
): CooldownMapItem {
  const isMessageCommand = command instanceof Command;
  const commandType: CommandTypes = isMessageCommand ? "message" : "slash";
  // TODO: May reduce bot perfomance in large bots, add precompiled data later.
  const commandName = isMessageCommand
    ? command.name
    : command.convertCommandData().name;
  const endsAt =
    Date.now() +
    (typeof cooldownOverride === "number"
      ? cooldownOverride
      : command.cooldown) *
      ONE_SECOND_IN_MILISECONDS;

  return {
    commandName,
    commandType,
    endsAt,
    messageLastShown: undefined,
  };
}

export function getCooldown(
  userId: string,
  command: Command | SlashCommand
): CooldownMapItem | undefined {
  const isMessageCommand = command instanceof Command;
  const commandType: CommandTypes = isMessageCommand ? "message" : "slash";
  // TODO: May reduce bot perfomance in large bots, add precompiled data later.
  const commandName = isMessageCommand
    ? command.name
    : command.convertCommandData().name;

  return (cooldowns.get(userId) ?? []).find(
    (cooldown) =>
      cooldown.commandName === commandName &&
      cooldown.commandType === commandType
  );
}

export function editCooldown(
  userId: string,
  command: Command | SlashCommand,
  options: EditCooldownMapItem
) {
  const cooldown = getCooldown(userId, command) ?? createCooldown(command);
  const newCooldown = { ...cooldown, ...options };

  setCooldown(userId, newCooldown);
}

export function setCooldown(userId: string, newCooldown: CooldownMapItem) {
  const currentUserCooldowns = cooldowns.get(userId) ?? [];
  const finalUserCooldowns = currentUserCooldowns
    .filter(
      (cooldown) =>
        cooldown.commandType !== newCooldown.commandType ||
        cooldown.commandName !== newCooldown.commandName
    )
    .concat(newCooldown);

  cooldowns.set(userId, finalUserCooldowns);
}
