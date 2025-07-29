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
  private readonly eventMap: EventMap = new Map();
  private readonly eventsDir: string;
  private readonly suppressWarnings: boolean;

  constructor(data?: EventHandlerConstructorData) {
    this.eventsDir = this.validateAndGetEventsDir(data?.eventsDir);
    this.suppressWarnings = this.validateAndGetSuppressWarnings(data?.suppressWarnings);
  }

  private validateAndGetEventsDir(eventsDir?: string): string {
    if (eventsDir !== undefined && typeof eventsDir !== "string") {
      error("eventsDir must be a string.");
    }
    return eventsDir ?? "events";
  }

  private validateAndGetSuppressWarnings(suppressWarnings?: boolean): boolean {
    if (suppressWarnings !== undefined && typeof suppressWarnings !== "boolean") {
      error("suppressWarnings must be a boolean.");
    }
    return suppressWarnings ?? false;
  }

  public async setEvents(client: Client): Promise<void> {
    this.clearEventsIfExist(client);
    await this.loadAndRegisterEvents(client);
  }

  private clearEventsIfExist(client: Client): void {
    if (this.eventMap.size > 0) {
      this.clearEvents(client);
      logInfo("Old events cleared before setting new events.");
    }
  }

  private async loadAndRegisterEvents(client: Client): Promise<void> {
    try {
      const eventFiles = await this.readEventFiles();
      const eventCategoryMap = await this.processEventFiles(eventFiles);
      this.registerEventCategories(client, eventCategoryMap);
      this.logRegistrationSummary();
    } catch (error) {
      logError("Reading events failed!");
      console.error(error);
    }
  }

  private async readEventFiles(): Promise<string[]> {
    const normalizedEventsDir = this.eventsDir.startsWith("./") 
      ? this.eventsDir 
      : `./${this.eventsDir}`;
    
    const dirents = await readdir(normalizedEventsDir, { withFileTypes: true });
    logInfo("Reading events...");
    
    return dirents
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name)
      .filter(name => this.isValidEventFile(name));
  }

  private isValidEventFile(fileName: string): boolean {
    const fileRegex = /^[\w\s]+\.(js|ts)$/;
    
    if (!fileRegex.test(fileName)) {
      if (!this.suppressWarnings) {
        logWarn(`'${fileName}' is not a valid JavaScript/TypeScript file.`);
      }
      return false;
    }
    
    return true;
  }

  private async processEventFiles(eventFiles: string[]): Promise<Map<CategoryList, Event<CategoryList>[]>> {
    const eventCategoryMap = new Map<CategoryList, Event<CategoryList>[]>();
    
    for (const fileName of eventFiles) {
      try {
        const event = await this.loadEventFromFile(fileName);
        if (event) {
          this.addEventToCategory(eventCategoryMap, event);
          logInfo(`Event file '${fileName}' loaded.`);
        }
      } catch (error) {
        logError(`Loading event '${fileName}' failed!`);
        console.error(error);
      }
    }
    
    return eventCategoryMap;
  }

  private async loadEventFromFile(fileName: string): Promise<Event<CategoryList> | null> {
    const normalizedEventsDir = this.eventsDir.startsWith("./") 
      ? this.eventsDir 
      : `./${this.eventsDir}`;
    
    const eventPath = `../../../../${normalizedEventsDir}/${fileName}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const eventModule = await import(eventPath);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const eventData = eventModule?.default;

    if (!eventData) {
      if (!this.suppressWarnings) {
        logWarn(`'${fileName}' does not have a default export.`);
      }
      return null;
    }

    if (!(eventData instanceof Event)) {
      if (!this.suppressWarnings) {
        logWarn(`'${fileName}' does not export an Event instance as default.`);
      }
      return null;
    }

    return eventData as Event<CategoryList>;
  }

  private addEventToCategory(
    eventCategoryMap: Map<CategoryList, Event<CategoryList>[]>,
    event: Event<CategoryList>
  ): void {
    const existingEvents = eventCategoryMap.get(event.categoryName) ?? [];
    eventCategoryMap.set(event.categoryName, [...existingEvents, event]);
  }

  private registerEventCategories(
    client: Client,
    eventCategoryMap: Map<CategoryList, Event<CategoryList>[]>
  ): void {
    for (const [categoryName, events] of eventCategoryMap) {
      const sortedEvents = this.sortEventsByRunOrder(events);
      const categoryFunction = this.createCategoryRunner(sortedEvents);
      
      client.on(categoryName, categoryFunction);
      
      this.eventMap.set(categoryName, {
        events: sortedEvents,
        categoryFunction,
      });
      
      logInfo(
        `Event category '${categoryName}' registered with ${sortedEvents.length.toString()} ${
          sortedEvents.length === 1 ? "event" : "events"
        }.`
      );
    }
  }

  private sortEventsByRunOrder(events: Event<CategoryList>[]): Event<CategoryList>[] {
    const orderedEvents = events
      .filter(event => event.runOrder !== undefined)
      .sort((a, b) => (a.runOrder ?? 0) - (b.runOrder ?? 0));
    
    const unorderedEvents = events.filter(event => event.runOrder === undefined);
    
    return [...orderedEvents, ...unorderedEvents];
  }

  private logRegistrationSummary(): void {
    const totalEvents = Array.from(this.eventMap.values())
      .reduce((total, eventList) => total + eventList.events.length, 0);
    
    logInfo(
      `${totalEvents.toString()} ${totalEvents === 1 ? "event" : "events"} registered successfully.`
    );
  }

  private createCategoryRunner(events: Event<CategoryList>[]): EventAnonymousRunner {
    return (...args) => {
      for (const event of events) {
        try {
          event.run(...args);
        } catch (error) {
          logError(`Event execution failed for category '${event.categoryName}'`);
          console.error(error);
        }
      }
    };
  }

  public getEvents(): Event<CategoryList>[] {
    return Array.from(this.eventMap.values()).flatMap(eventList => eventList.events);
  }

  public getEventCategory<EventCategory extends CategoryList>(
    eventName: EventCategory
  ): EventList<EventCategory> | undefined {
    return this.eventMap.get(eventName) as EventList<EventCategory> | undefined;
  }

  public clearEvents(client: Client): void {
    for (const [categoryName, { categoryFunction }] of this.eventMap) {
      client.removeListener(categoryName, categoryFunction as (...args: unknown[]) => void);
    }
    this.eventMap.clear();
  }
}
