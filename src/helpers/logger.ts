export function error(message: string): never {
  throw new Error(`[DjsBotBase] [ERROR]: ${message}`);
}

export function logError(message: string): void {
  console.error(`[DjsBotBase] [ERROR]: ${message}`);
}

export function logWarn(message: string): void {
  console.warn(`[DjsBotBase] [WARN]: ${message}`);
}

export function logInfo(message: string): void {
  console.info(`[DjsBotBase] [INFO]: ${message}`);
}
