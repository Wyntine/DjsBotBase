const TAG = "DjsBotBase";

export function error(message: string): never {
  throw new Error(`[DjsBotBase] [ERROR]: ${message}`);
}

export function logError(...messages: unknown[]) {
  const messageBase = `[${TAG}] [ERROR]:`;
  console.error(messageBase, ...messages);
}

export function logWarn(...messages: unknown[]) {
  const messageBase = `[${TAG}] [WARN]:`;
  console.warn(messageBase, ...messages);
}

export function logInfo(...messages: unknown[]): void {
  const messageBase = `[${TAG}] [INFO]:`;
  console.info(messageBase, ...messages);
}
