import { InnerObjectKey } from "./utils.js";

export interface LoggerData {
  tag: string;
}

export type WarnMessages = InnerObjectKey<
  typeof import("../assets/messages/warn.json"),
  string
>;
export type ErrorMessages = InnerObjectKey<
  typeof import("../assets/messages/error.json"),
  string
>;
