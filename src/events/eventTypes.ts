import type { Awaitable, ClientEvents } from "discord.js";
import type { Event } from "./eventClass";

export type CategoryList = keyof ClientEvents;

export type EventMap = Map<CategoryList, EventList<CategoryList>>;

export type EventAnonymousRunner = (...data: ClientEvents[CategoryList]) => Awaitable<any>;

export type EventRunner<EventCategory extends CategoryList> = (
  ...data: ClientEvents[EventCategory]
) => Awaitable<unknown>;

export interface EventList<CategoryName extends CategoryList> {
  categoryFunction: EventAnonymousRunner;
  events: Event<CategoryName>[];
}

export interface EventData<EventCategory extends CategoryList> {
  categoryName: EventCategory;
  runOrder?: number;
  run: EventRunner<EventCategory>;
}

export interface EventHandlerConstructorData {
  eventsDir?: string;
  suppressWarnings?: boolean;
}
