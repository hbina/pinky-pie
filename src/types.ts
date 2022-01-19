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

export type MongodbConnectInput = Readonly<{
  url: string;
  port: number;
}>;

export type MongodbFindCollectionsInput = Readonly<{ databaseName: string }>;

export type MongodbFindDocumentsInput = Readonly<{
  databaseName: string;
  collectionName: string;
  page: number;
  perPage: number;
  documentsFilter: Record<string, unknown>;
  documentsProjection: Record<string, unknown>;
  documentsSort: Record<string, unknown>;
}>;

export type MongodbDocumentCountInput = Readonly<{
  databaseName: string;
  collectionName: string;
}>;

export type MongodbAggregateDocumentsInput = Readonly<{
  idx: number;
  sampleCount: number;
  databaseName: string;
  collectionName: string;
  stages: AggregationStageInput[];
}>;

export type AggregationStageInput = {
  collapsed: boolean;
  stageOperation: string;
  stageBody: string;
};

export type AggregationStageOutput = {
  loading: VALUE_STATES;
  documents: Record<string, unknown>[];
};

export type MongodbAnalyzeDocumentInput = {
  databaseName: string;
  collectionName: string;
  documentsFilter: Record<string, unknown>;
};

export type MongodbAnalyzeDocumentOutput = Array<[string, [string, number][]]>;

export type MongodbServerInformation = {
  address: {
    Tcp: {
      host: string;
      port: number;
    };
  };
  server_type: string;
};

export enum VALUE_STATES {
  UNLOADED = "UNLOADED",
  LOADING = "LOADING",
  LOADED = "LOADED",
}

export enum CONTAINER_STATUS {
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
}
