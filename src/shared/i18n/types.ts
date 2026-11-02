import type { ru } from "./ru.ts";

export type Messages = typeof ru;

export type DeepPartial<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? readonly DeepPartial<Item>[]
    : T extends object
      ? { [Key in keyof T]?: DeepPartial<T[Key]> }
      : T;
