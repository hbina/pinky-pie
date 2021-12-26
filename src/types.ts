import React from "react";

export type ReactSetState<T> = React.Dispatch<React.SetStateAction<T>>;
export type ReactState<T> = [T, ReactSetState<T>];

export type DatabaseSpecification = Readonly<{
  name: string;
  sizeOnDisk: number;
  empty: boolean;
  shards?: Record<string, unknown>;
}>;

export type CollectionSpecification = Readonly<{
  name: string;
  type: string;
}>;

export type BsonDocument = Readonly<Record<string, unknown>>;
