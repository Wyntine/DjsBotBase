export type ExpandDeep<T> = T extends object
  ? { [K in keyof T]: ExpandDeep<T[K]> }
  : T;

export type InnerObjectKey<Obj extends KeyValuePair, FilteredType = unknown> = {
  [Key in keyof Obj]: Key extends string
    ? Obj[Key] extends KeyValuePair
      ?
          | (Obj[Key] extends FilteredType ? Key : never)
          | `${Key}.${InnerObjectKey<Obj[Key], FilteredType>}`
      : Obj[Key] extends FilteredType
        ? Key
        : never
    : never;
}[keyof Obj];

export type KeyValuePair = Record<string, unknown>;
