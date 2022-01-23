import React from "react";

export type ReactSetState<T> = React.Dispatch<React.SetStateAction<T>>;
export type ReactState<T> = [T, ReactSetState<T>];

export type DatabaseSpecification = Readonly<{
  name: string;
  sizeOnDisk: number;
  empty: boolean;
  shards?: Record<string, unknown>;
  collections: {
    name: string;
    type: string;
  }[];
}>;

export type BsonDocument = Readonly<Record<string, unknown>>;

export enum VALUE_STATES {
  UNLOADED = "UNLOADED",
  LOADING = "LOADING",
  LOADED = "LOADED",
}

export enum CONTAINER_STATUS {
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
}

export enum DISPLAY_TYPES {
  MAIN = "MAIN",
  INFO = "INFO",
  METRIC = "METRIC",
}
