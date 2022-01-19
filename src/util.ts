import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";

import {
  BsonDocument,
  DatabaseSpecification,
  CollectionSpecification,
  AggregationStageInput,
} from "./types";

function apiCall<O>(
  funName: string,
  args: Record<string, unknown>
): Promise<O> {
  console.log(`calling ${funName} with`, args);
  return invoke<O>(funName, args);
}

const getWindowDimensions = () => {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
};

export const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
};

export const mongodb_aggregate_documents = async ({
  databaseName,
  collectionName,
  idx,
  sampleCount,
  stages,
}: {
  databaseName: string;
  collectionName: string;
  idx: number;
  sampleCount: number;
  stages: AggregationStageInput[];
}) =>
  apiCall<BsonDocument[]>("mongodb_aggregate_documents", {
    databaseName,
    collectionName,
    stages: [
      {
        $limit: sampleCount,
      },
      ...stages.map(({ stageBody, stageOperation }) => ({
        [stageOperation]: JSON.parse(stageBody),
      })),
    ],
  });

export const mongodb_connect = async ({
  url,
  port,
}: {
  url: string;
  port: number;
}) =>
  apiCall<DatabaseSpecification[]>("mongodb_connect", {
    url,
    port,
  });

export const mongodb_find_collections = async ({
  databaseName,
}: {
  databaseName: string;
}) =>
  apiCall<CollectionSpecification[]>("mongodb_find_collections", {
    databaseName,
  });

export const mongodb_find_documents = async ({
  databaseName,
  collectionName,
  page,
  perPage,
  documentsFilter,
  documentsProjection,
  documentsSort,
}: {
  databaseName: string;
  collectionName: string;
  page: number;
  perPage: number;
  documentsFilter: Record<string, unknown>;
  documentsProjection: Record<string, unknown>;
  documentsSort: Record<string, unknown>;
}) =>
  apiCall<BsonDocument[]>("mongodb_find_documents", {
    databaseName,
    collectionName,
    page,
    perPage,
    documentsFilter,
    documentsProjection,
    documentsSort,
  });

export const mongodb_count_documents = async ({
  databaseName,
  collectionName,
  documentsFilter,
}: {
  databaseName: string;
  collectionName: string;
  documentsFilter: Record<string, unknown>;
}) =>
  apiCall<number>("mongodb_count_documents", {
    databaseName,
    collectionName,
    documentsFilter,
  });
