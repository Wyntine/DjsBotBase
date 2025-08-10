import type { Awaitable, ClientEvents } from "discord.js";
import type { Event } from "./eventClass";

export type CategoryList = keyof ClientEvents;

export type EventMap = Map<CategoryList, EventList<CategoryList>>;

export type EventAnonymousRunner = (
  ...data: ClientEvents[CategoryList]
) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
Awaitable<any>;

export type EventRunner<EventCategory extends CategoryList> = (
  ...data: ClientEvents[EventCategory]
) => Awaitable<unknown>;

export interface EventList<CategoryName extends CategoryList> {
  readonly categoryFunction: EventAnonymousRunner;
  readonly events: Event<CategoryName>[];
}

export interface EventData<EventCategory extends CategoryList> {
  readonly categoryName: EventCategory;
  readonly runOrder?: number;
  readonly run: EventRunner<EventCategory>;
}

export interface EventHandlerConstructorData {
  readonly eventsDir?: string;
  readonly suppressWarnings?: boolean;
}
