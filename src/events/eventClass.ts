import type { ClientEvents } from "discord.js";
import type { EventData, EventRunner } from "./eventTypes";

import { error } from "../helpers/logger";

export class Event<EventCategory extends keyof ClientEvents> {
  private data: EventData<EventCategory>;

  constructor(data: EventData<EventCategory>) {
    this.verifyDataType(data);
    this.verifyCategoryName(data);
    this.verifyEventRunner(data);
    this.verifyEventRunOrder(data);

    this.data = data;
  }

  get categoryName(): EventCategory {
    return this.data.categoryName;
  }

  get run(): EventRunner<EventCategory> {
    return this.data.run;
  }

  get runOrder(): number | undefined {
    return this.data.runOrder;
  }

  //* Verifiers

  private verifyDataType(
    data: unknown
  ): asserts data is EventData<EventCategory> {
    if (!data) error("Event data cannot be undefined.");
    if (typeof data !== "object" || Array.isArray(data))
      error("Event data must be a key-value pair object.");
  }

  private verifyCategoryName(data: EventData<EventCategory>) {
    if (!("categoryName" in data) || typeof data.categoryName !== "string") {
      error("Event category name must be given.");
    }
  }

  private verifyEventRunner(data: EventData<EventCategory>) {
    if (!("run" in data) || typeof data.run !== "function") {
      error("Event runner must be given.");
    }
  }

  private verifyEventRunOrder(data: EventData<EventCategory>) {
    if ("runOrder" in data) {
      if (typeof data.runOrder !== "number") {
        error("'runOrder' must be a number.");
      }

      if (!Number.isSafeInteger(data.runOrder))
        error("'runOrder' must be a integer.");

      if (data.runOrder < 0)
        error("'runOrder' must be greater than or equal to zero.");
    }
  }
}
