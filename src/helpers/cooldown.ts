import { SlashCommand } from "src/commands/slashCommandClass";
import {
  CommandTypes,
  CooldownMapItem,
  EditCooldownMapItem,
} from "./helperTypes";
import { Command } from "src/commands/commandClass";

const cooldowns = new Map<string, CooldownMapItem[]>();

export function checkCooldown(
  userId: string,
  command: Command | SlashCommand
): [CooldownMapItem | undefined, boolean] {
  const cooldown = getCooldown(userId, command);

  const result = ((): boolean => {
    if (!cooldown) return true;
    if (Number.isInteger(command.cooldown) && command.cooldown <= 0)
      return true;
    if (Date.now() <= cooldown.endsAt) return false;
    if (cooldown.messageShown) return false;

    return true;
  })();

  return [cooldown, result];
}

export function addCooldown(
  userId: string,
  command: SlashCommand | Command,
  cooldown?: number
): void {
  if (Number.isInteger(command.cooldown) && command.cooldown <= 0) return;

  const cooldownItem = createCooldown(command, cooldown);
  setCooldown(userId, cooldownItem);
}

export function createCooldown(
  command: Command | SlashCommand,
  cooldown?: number
): CooldownMapItem {
  const isMessageCommand = command instanceof Command;
  const commandType: CommandTypes = isMessageCommand ? "message" : "slash";
  // TODO: May reduce bot perfomance in large bots, add precompiled data later.
  const commandName = isMessageCommand
    ? command.name
    : command.convertCommandData().name;
  const endsAt =
    Date.now() +
    (typeof cooldown === "number" ? cooldown : command.cooldown) * 1000;

  return {
    commandName,
    commandType,
    endsAt,
    messageShown: false,
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

export function setCooldown(userId: string, cooldown: CooldownMapItem) {
  const currentUserCooldowns = cooldowns.get(userId) ?? [];
  const finalUserCooldowns = currentUserCooldowns
    .filter(
      (cooldown) =>
        cooldown.commandType === cooldown.commandType &&
        cooldown.commandName === cooldown.commandName
    )
    .concat(cooldown);

  cooldowns.set(userId, finalUserCooldowns);
}
