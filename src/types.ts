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

export type MongodbConnectInput = Readonly<{ mongodbUrl: string }>;
export type ListCollectionsInput = Readonly<{ databaseName: string }>;
export type ListDocumentsInput = Readonly<{
  databaseName: string;
  collectionName: string;
  page: number;
  perPage: number;
  documentsFilter: Record<string, unknown>;
  documentsProjection: Record<string, unknown>;
  documentsSort: Record<string, unknown>;
}>;
export type EstimatedDocumentCountInput = Readonly<{
  databaseName: string;
  collectionName: string;
}>;
