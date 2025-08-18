import type {
  CategoryList,
  EventAnonymousRunner,
  EventHandlerConstructorData,
  EventList,
  EventMap,
} from "./eventTypes";
import type { Client } from "discord.js";

import { Event } from "./eventClass";
import { readdir } from "fs/promises";
import { error, logError, logInfo, logWarn } from "../helpers/logger";

export class EventHandler {
  private eventMap: EventMap = new Map();
  private eventsDir = "events";
  private suppressWarnings = false;

  constructor(data?: EventHandlerConstructorData) {
    if (!data) return;

    this.eventsDir = this.verifyEventsDir(data);
    this.suppressWarnings = this.verifySuppressWarnings(data);
  }

  public async setEvents(client: Client): Promise<void> {
    const { eventsDir } = this;

    if (this.eventMap.size) {
      this.clearEvents(client);
      logInfo("Old events cleared before setting new events.");
    }

    try {
      const newEventsDir = eventsDir.startsWith("./")
        ? eventsDir
        : `./${eventsDir}`;
      const events = await readdir(newEventsDir, { withFileTypes: true });
      const eventCategorySet = new Map<CategoryList, Event<CategoryList>[]>();

      logInfo("Reading events...");

      for (const event of events) {
        const { name } = event;

        try {
          if (!event.isFile()) {
            if (!this.suppressWarnings) logWarn(`'${name}' is not a file.`);
            continue;
          }

          const fileRegex = /^(\w|\s)+.(js|ts)$/;

          if (!fileRegex.test(name)) {
            if (!this.suppressWarnings)
              logWarn(`'${name}' is not a JavaScript/TypeScript file.`);
            continue;
          }

          const eventPath = `../../../../${newEventsDir}/${name}`;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const eventData = (await import(eventPath))?.default;

          if (!eventData) {
            if (!this.suppressWarnings)
              logWarn(`'${name}' does not have an default export.`);
            continue;
          }

          if (!(eventData instanceof Event)) {
            if (!this.suppressWarnings) {
              logWarn(
                `'${name}' does not have default export of Event instance.`
              );
            }
            continue;
          }

          const newEvent = eventData as Event<CategoryList>;

          eventCategorySet.set(newEvent.categoryName, [
            ...(eventCategorySet.get(newEvent.categoryName) ?? []),
            newEvent,
          ]);
          logInfo(`Event file '${name}' read.`);
        } catch (innerError) {
          logError(`Reading event '${name}' failed!`);
          console.error(innerError);
        }
      }

      eventCategorySet.forEach((eventsList, eventCategory) => {
        const orderedEvents = eventsList
          .filter((event) => event.runOrder !== undefined)
          .sort(
            (firstEvent, secondEvent) =>
              (firstEvent.runOrder ?? 0) - (secondEvent.runOrder ?? 0)
          );
        const randomEvents = eventsList.filter(
          (event) => event.runOrder === undefined
        );
        const sortedEvents = [...orderedEvents, ...randomEvents];
        const categoryFunction = this.createCategoryRunner(sortedEvents);
        client.on(eventCategory, categoryFunction);
        this.eventMap.set(eventCategory, {
          events: sortedEvents,
          categoryFunction,
        });
        logInfo(
          `Event category '${eventCategory}' (${sortedEvents.length.toString()} ${
            sortedEvents.length === 1 ? "event" : "events"
          }) registered.`
        );
      });
      const totalEvents = Array.from(this.eventMap.values()).reduce(
        (total, current) => total + current.events.length,
        0
      );
      logInfo(
        `${totalEvents.toString()} ${
          totalEvents === 1 ? "event" : "events"
        } registered.`
      );
      logInfo("Reading events finished.");
    } catch (outerError) {
      logError("Reading events failed!");
      console.error(outerError);
    }
  }

  public getEvents(): Event<CategoryList>[] {
    return Array.from(this.eventMap.values()).flatMap(
      (eventList) => eventList.events
    );
  }

  public getEventCategory<EventCategory extends CategoryList>(
    eventName: EventCategory
  ): EventList<EventCategory> | undefined {
    return this.eventMap.get(eventName) as EventList<EventCategory> | undefined;
  }

  public clearEvents(client: Client): void {
    this.eventMap.forEach(({ categoryFunction }, categoryName) =>
      client.removeListener(
        categoryName,
        categoryFunction as (...args: unknown[]) => void
      )
    );
    this.eventMap.clear();
  }

  // TODO: Add error handlers for events and commands
  private createCategoryRunner(
    events: Event<CategoryList>[]
  ): EventAnonymousRunner {
    return (...data) => {
      for (const event of events) {
        // Make consecutive event execution async
        void (async () => {
          try {
            await event.run(...data);
          } catch (error) {
            logError(
              `An error occurred in event category '${event.categoryName}'`,
              error
            );
          }
        })();
      }
    };
  }

  //* Verifiers

  private verifyEventsDir(data: EventHandlerConstructorData): string {
    if (!("eventsDir" in data)) return this.eventsDir;

    if (typeof data.eventsDir !== "string") {
      error("'eventsDir' must be a string.");
    }

    return data.eventsDir;
  }

  private verifySuppressWarnings(data: EventHandlerConstructorData): boolean {
    if (!("suppressWarnings" in data)) return this.suppressWarnings;

    if (typeof data.suppressWarnings !== "boolean") {
      error("'suppressWarnings' must be a boolean.");
    }

    return data.suppressWarnings;
  }
}
