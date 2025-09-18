import { LoggerData } from "@/types/logger.js";
import chalk from "chalk";

export enum LogLevel {
  ERROR = "error",
  INFO = "info",
  DEBUG = "debug",
  WARN = "warn",
}

const LogLevelMap = {
  [LogLevel.ERROR]: chalk.red,
  [LogLevel.INFO]: chalk.cyan,
  [LogLevel.DEBUG]: chalk.white,
  [LogLevel.WARN]: chalk.yellow,
};

export class Logger {
  private static packageTag = "DjsBotBase";
  public readonly tag: string;

  constructor(options: LoggerData) {
    this.tag = options.tag;
  }

  public static setPackageTag(newTag: string): void {
    this.packageTag = newTag;
  }

  private log(level: LogLevel, messages: unknown[]): void {
    const logMessage = this.prepareLogMessage(level);
    const loggerFunction =
      level === LogLevel.ERROR
        ? console.error
        : level === LogLevel.WARN
          ? console.warn
          : console.log;

    loggerFunction(logMessage, ...messages);
  }

  private prepareLogMessage(level: LogLevel) {
    const timestamp = new Date().toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const coloredTimestamp = timestamp
      .split(" ")
      .map((text) => chalk.hex("#a3e3ed")(text))
      .join(` ${chalk.bold("•")} `);

    const color = LogLevelMap[level];
    return `[${coloredTimestamp}] [${chalk.hex("#F7F6CF")(Logger.packageTag)}] [${chalk.hex(
      "#F7F6CF"
    )(this.tag)}] [${color(level.toUpperCase())}]:`;
  }

  public error(...messages: unknown[]): void {
    this.log(LogLevel.ERROR, messages);
  }

  public info(...messages: unknown[]): void {
    this.log(LogLevel.INFO, messages);
  }

  public debug(...messages: unknown[]): void {
    // TODO: Add debug mode in config.yml
    this.log(LogLevel.DEBUG, messages);
  }

  public warn(...messages: unknown[]): void {
    this.log(LogLevel.WARN, messages);
  }

  public warnConditionally(key: string, ...messages: unknown[]): void {
    // TODO: Check config.yml for the key
    this.log(LogLevel.WARN, messages);
  }

  public throw(...messages: unknown[]): never {
    this.error(...messages);
    throw new Error();
  }
}
