import React, { useState, useEffect } from "react";
import { cloneDeep } from "lodash";

import { useAggregateTabState } from "./components/AggregateTab";
import { useDocumentsTabState } from "./components/DocumentsTab";
import { useMongodbUrlBarState } from "./components/MongoDbUrlBar";
import { useSchemaTabState } from "./components/SchemaTab";
import { useServerInfoState } from "./components/ServerInfo";
import {
  CONTAINER_STATES,
  BsonDocument,
  MongodbAggregateDocumentsInput,
  AggregationStageOutput,
} from "./types";

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

export const invoke: <T extends Record<string, unknown>, O>(
  name: string,
  payload: T
) => Promise<O> =
  // @ts-ignore
  window.__TAURI__.invoke;

export const mongodb_aggregate_documents = async (
  input: MongodbAggregateDocumentsInput,
  setStagesOutput: React.Dispatch<
    React.SetStateAction<AggregationStageOutput[]>
  >
) => {
  try {
    setStagesOutput((stagesOutput) => {
      const copy = cloneDeep(stagesOutput);
      copy[input.idx] = {
        loading: CONTAINER_STATES.LOADING,
        documents: [],
      };
      return copy;
    });
    if (input.sampleCount > 0) {
      const documents = await invoke<
        {
          databaseName: string;
          collectionName: string;
          stages: Record<string, unknown>[];
        },
        BsonDocument[]
      >("mongodb_aggregate_documents", {
        databaseName: input.databaseName,
        collectionName: input.collectionName,
        stages: [
          {
            $limit: input.sampleCount,
          },
          ...input.stages.map(({ stageBody, stageOperation }) => ({
            [stageOperation]: JSON.parse(stageBody),
          })),
        ],
      });
      setStagesOutput((stagesOutput) => {
        const copy = cloneDeep(stagesOutput);
        copy[input.idx] = {
          loading: CONTAINER_STATES.LOADED,
          documents,
        };
        return copy;
      });
    } else {
      setStagesOutput((stages) =>
        stages.map((s) => ({
          loading: CONTAINER_STATES.LOADED,
          documents: [],
        }))
      );
    }
  } catch (e) {
    console.error(e);
  }
};

export const useAppState = () => {
  const { width, height } = useWindowDimensions();
  const connectionData = useMongodbUrlBarState();
  const documentsTabState = useDocumentsTabState();
  const aggregateTabState = useAggregateTabState();
  const serverInfoState = useServerInfoState();
  const schemaTabState = useSchemaTabState();

  return {
    window: { width, height },
    connectionData,
    documentsTabState,
    aggregateTabState,
    serverInfoState,
    schemaTabState,
  };
};
