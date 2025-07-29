import { SlashCommand } from "../commands/slashCommandClass";
import { Command } from "../commands/commandClass";
import type {
  CommandTypes,
  CooldownMapItem,
  EditCooldownMapItem,
} from "./helperTypes";

const cooldowns = new Map<string, CooldownMapItem[]>();

export function checkCooldown(
  userId: string,
  command: Command | SlashCommand
): [CooldownMapItem | undefined, boolean] {
  const cooldownItem = getCooldown(userId, command);
  const isValid = evaluateCooldownValidity(cooldownItem, command);
  
  return [cooldownItem, isValid];
}

export function addCooldown(
  userId: string,
  command: SlashCommand | Command,
  cooldownOverride?: number
): void {
  if (!shouldApplyCooldown(command)) {
    return;
  }

  const cooldownItem = createCooldown(command, cooldownOverride);
  setCooldown(userId, cooldownItem);
}

export function editCooldown(
  userId: string,
  command: Command | SlashCommand,
  options: EditCooldownMapItem
): void {
  const existingCooldown = getCooldown(userId, command);
  const baseCooldown = existingCooldown ?? createCooldown(command);
  const updatedCooldown = { ...baseCooldown, ...options };

  setCooldown(userId, updatedCooldown);
}

export function getCooldown(
  userId: string,
  command: Command | SlashCommand
): CooldownMapItem | undefined {
  const userCooldowns = cooldowns.get(userId);
  if (!userCooldowns) {
    return undefined;
  }

  const commandInfo = getCommandInfo(command);
  
  return userCooldowns.find(cooldown => 
    cooldown.commandName === commandInfo.name &&
    cooldown.commandType === commandInfo.type
  );
}

function evaluateCooldownValidity(
  cooldownItem: CooldownMapItem | undefined,
  command: Command | SlashCommand
): boolean {
  if (!cooldownItem) {
    return true;
  }

  if (!shouldApplyCooldown(command)) {
    return true;
  }

  if (Date.now() > cooldownItem.endsAt) {
    return true;
  }

  return false;
}

function shouldApplyCooldown(command: Command | SlashCommand): boolean {
  return Number.isInteger(command.cooldown) && command.cooldown > 0;
}

function createCooldown(
  command: Command | SlashCommand,
  cooldownOverride?: number
): CooldownMapItem {
  const commandInfo = getCommandInfo(command);
  const cooldownDuration = cooldownOverride ?? command.cooldown;
  const endsAt = Date.now() + cooldownDuration * 1000;

  return {
    commandName: commandInfo.name,
    commandType: commandInfo.type,
    endsAt,
    messageShown: false,
  };
}

function getCommandInfo(command: Command | SlashCommand): { name: string; type: CommandTypes } {
  if (command instanceof Command) {
    return {
      name: command.name,
      type: "message",
    };
  }

  return {
    name: command.convertCommandData().name,
    type: "slash",
  };
}

function setCooldown(userId: string, newCooldown: CooldownMapItem): void {
  const userCooldowns = cooldowns.get(userId) ?? [];
  
  const filteredCooldowns = userCooldowns.filter(cooldown => 
    !(cooldown.commandType === newCooldown.commandType && 
      cooldown.commandName === newCooldown.commandName)
  );
  
  const updatedCooldowns = [...filteredCooldowns, newCooldown];
  cooldowns.set(userId, updatedCooldowns);
}
