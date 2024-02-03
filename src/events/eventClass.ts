import type { ClientEvents } from "discord.js";
import type { EventData, EventRunner } from "./eventTypes";

import { error } from "../helpers/logger";

export class Event<EventCategory extends keyof ClientEvents> {
  private data: EventData<EventCategory>;

  constructor(data: EventData<EventCategory>) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!data) error("Event data can not be undefined.");

    if (!("categoryName" in data) || typeof data.categoryName !== "string") {
      error("Event category name must be given.");
    }

    if (!("run" in data) || typeof data.run !== "function") {
      error("Event runner must be given.");
    }

    if ("runOrder" in data) {
      if (typeof data.runOrder !== "number") {
        error("'runOrder' must be a number.");
      }

      if (!Number.isSafeInteger(data.runOrder))
        error("'runOrder' must be a integer.");

      if (data.runOrder < 0)
        error("'runOrder' must be greater than or equal to zero.");
    }

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
}
