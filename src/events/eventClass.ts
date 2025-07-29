import type { ClientEvents } from "discord.js";
import type { EventData, EventRunner } from "./eventTypes";
import { error } from "../helpers/logger";

export class Event<EventCategory extends keyof ClientEvents> {
  private readonly data: EventData<EventCategory>;

  constructor(data: EventData<EventCategory>) {
    this.validateConstructorData(data);
    this.data = data;
  }

  private validateConstructorData(data: EventData<EventCategory>): asserts data is NonNullable<EventData<EventCategory>> {
    this.validateCategoryName(data);
    this.validateRunner(data);
    this.validateRunOrder(data);
  }

  private validateCategoryName(data: EventData<EventCategory>): void {
    if (!("categoryName" in data) || typeof data.categoryName !== "string" || !data.categoryName.trim()) {
      error("Event category name must be a non-empty string.");
    }
  }

  private validateRunner(data: EventData<EventCategory>): void {
    if (!("run" in data) || typeof data.run !== "function") {
      error("Event runner must be a function.");
    }
  }

  private validateRunOrder(data: EventData<EventCategory>): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if ("runOrder" in data && data.runOrder !== undefined) {
      if (typeof data.runOrder !== "number") {
        error("Event runOrder must be a number.");
      }

      if (!Number.isSafeInteger(data.runOrder)) {
        error("Event runOrder must be a safe integer.");
      }

      if (data.runOrder < 0) {
        error("Event runOrder must be greater than or equal to zero.");
      }
    }
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
