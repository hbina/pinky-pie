import { useState, useEffect } from "react";
import { chain, cloneDeep } from "lodash";

import { useAggregateTabState } from "./components/AggregateTab";
import { useDocumentsTabState } from "./components/DocumentsTab";
import { useMongodbUrlBarState } from "./components/MongoDbUrlBar";
import { useSchemaTabState } from "./components/SchemaTab";
import { useServerInfoState } from "./components/ServerInfo";
import {
  CONTAINER_STATES,
  CONTAINER_STATUS,
  MongodbConnectInput,
  DatabaseSpecification,
  MongodbFindCollectionsInput,
  CollectionSpecification,
  MongodbFindDocumentsInput,
  BsonDocument,
  MongodbDocumentCountInput,
  MongodbAggregateDocumentsInput,
  MongodbServerInformation,
  MongodbAnalyzeDocumentInput,
  MongodbAnalyzeDocumentOutput,
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

export const useAppState = () => {
  const { width, height } = useWindowDimensions();
  const connectionData = useMongodbUrlBarState();
  const documentsTabState = useDocumentsTabState();
  const aggregateTabState = useAggregateTabState();
  const serverInfoState = useServerInfoState();
  const schemaTabState = useSchemaTabState();

  const mongodb_connect = (input: MongodbConnectInput) => {
    const f = async (input: MongodbConnectInput) => {
      try {
        connectionData.setDatabaseName("");
        connectionData.setCollections([]);
        connectionData.setCollectionName("");
        connectionData.setCollectionsLoading(CONTAINER_STATES.HIDDEN);

        connectionData.setUrlConnected(false);
        connectionData.setDatabases([]);
        connectionData.setDatabasesState(CONTAINER_STATES.LOADING);
        connectionData.setButtonStatus(CONTAINER_STATUS.DISABLED);
        const databases = await invoke<
          MongodbConnectInput,
          DatabaseSpecification[]
        >("mongodb_connect", input);
        connectionData.setUrlConnected(true);
        connectionData.setDatabases(databases);
        connectionData.setDatabasesState(CONTAINER_STATES.LOADED);
        connectionData.setButtonStatus(CONTAINER_STATUS.ENABLED);
      } catch (error) {
        console.error(error);
      }
    };
    f(input);
  };

  const mongodb_find_collections = (input: MongodbFindCollectionsInput) => {
    const f = async (input: MongodbFindCollectionsInput) => {
      try {
        connectionData.setCollectionName("");

        connectionData.setCollectionsLoading(CONTAINER_STATES.LOADING);
        connectionData.setCollections([]);
        const collections = await invoke<
          MongodbFindCollectionsInput,
          CollectionSpecification[]
        >("mongodb_find_collections", input);
        connectionData.setCollectionsLoading(CONTAINER_STATES.LOADED);
        connectionData.setCollections(collections);
      } catch (error) {
        console.error(error);
      }
    };
    f(input);
  };

  const mongodb_find_documents = (input: MongodbFindDocumentsInput) => {
    const f = async (input: MongodbFindDocumentsInput) => {
      try {
        documentsTabState.setQueryButtonStatus(CONTAINER_STATUS.DISABLED);
        documentsTabState.setLoading(true);
        documentsTabState.setDocuments([]);
        documentsTabState.setDocumentsCount(0);
        const documents = await invoke<
          MongodbFindDocumentsInput,
          BsonDocument[]
        >("mongodb_find_documents", input);
        const documentCount = await invoke<MongodbDocumentCountInput, number>(
          "mongodb_count_documents",
          input
        );
        documentsTabState.setQueryButtonStatus(CONTAINER_STATUS.ENABLED);
        documentsTabState.setLoading(false);
        documentsTabState.setDocuments(documents);
        documentsTabState.setDocumentsCount(documentCount);
      } catch (error) {
        console.error(error);
      }
    };
    f(input);
  };

  const mongodb_aggregate_documents = (
    input: MongodbAggregateDocumentsInput
  ) => {
    const f = async (input: MongodbAggregateDocumentsInput) => {
      try {
        aggregateTabState.setStagesOutput((stagesOutput) => {
          const copy = cloneDeep(stagesOutput);
          copy[input.idx] = {
            loading: true,
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
          aggregateTabState.setStagesOutput((stagesOutput) => {
            const copy = cloneDeep(stagesOutput);
            copy[input.idx] = {
              loading: false,
              documents,
            };
            return copy;
          });
        } else {
          aggregateTabState.setStagesOutput((stages) =>
            stages.map((s) => ({
              loading: false,
              documents: [],
            }))
          );
        }
      } catch (e) {
        console.error(e);
      }
    };
    f(input);
  };

  const mongodb_server_description = (input: MongodbConnectInput) => {
    const f = async (input: MongodbConnectInput) => {
      serverInfoState.setServerInformation(undefined);
      const result = await invoke<
        MongodbConnectInput,
        MongodbServerInformation
      >("mongodb_server_description", input);
      serverInfoState.setServerInformation(result);
    };
    f(input);
  };

  const mongodb_analyze_documents = (input: MongodbAnalyzeDocumentInput) => {
    const f = async (input: MongodbAnalyzeDocumentInput) => {
      schemaTabState.setLoading(true);
      schemaTabState.setDocuments([]);
      const result = await invoke<
        MongodbAnalyzeDocumentInput,
        MongodbAnalyzeDocumentOutput
      >("mongodb_analyze_documents", input);
      schemaTabState.setLoading(false);
      schemaTabState.setDocuments(chain(result).sort().value());
    };
    f(input);
  };

  return {
    window: { width, height },
    functions: {
      mongodb_connect,
      mongodb_find_collections,
      mongodb_find_documents,
      mongodb_aggregate_documents,
      mongodb_server_description,
      mongodb_analyze_documents,
    },
    connectionData,
    documentsTabState,
    aggregateTabState,
    serverInfoState,
    schemaTabState,
  };
};
