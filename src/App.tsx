import "bootstrap/dist/css/bootstrap.min.css";

import { useCallback, useMemo } from "react";
import { debounce } from "lodash";
import { Tab, Tabs } from "react-bootstrap";

import MongoDbUrlBar, {
  useMongodbUrlBarState,
} from "./components/MongoDbUrlBar";
import {
  DatabaseSpecification,
  CollectionSpecification,
  BsonDocument,
  MongodbConnectInput,
  MongodbFindCollectionsInput,
  MongodbAggregateDocumentsInput,
  MongodbDocumentCountInput,
  MongodbFindDocumentsInput,
  CONTAINER_STATES,
} from "./types";
import DocumentListing, {
  useDocumentsTabState,
} from "./components/DocumentListing";
import DocumentAggregation, {
  useAggregateTabState,
} from "./components/DocumentAggregation";

export const useAppState = () => {
  const connectionData = useMongodbUrlBarState();
  const documentsTab = useDocumentsTabState();
  const aggregateTab = useAggregateTabState();

  const {
    setUrlConnected,
    databaseName,
    setDatabaseName,
    setDatabases,
    setDatabasesLoading,
    setCollections,
    collectionName,
    setCollectionName,
    setCollectionsLoading,
  } = connectionData;

  const mongodb_connect = useMemo(
    () =>
      debounce((input: MongodbConnectInput) => {
        const f = async () => {
          try {
            setUrlConnected(false);
            setDatabases([]);
            setDatabaseName("");
            setCollections([]);
            setCollectionName("");
            setDatabasesLoading(CONTAINER_STATES.LOADING);
            const databases = await invoke<
              DatabaseSpecification[],
              MongodbConnectInput
            >("mongodb_connect", input);
            setUrlConnected(true);
            setDatabases(databases);
            setDatabasesLoading(CONTAINER_STATES.LOADED);
          } catch (error) {
            console.error(error);
          }
        };
        f();
      }),
    [
      setCollectionName,
      setCollections,
      setDatabaseName,
      setDatabases,
      setDatabasesLoading,
      setUrlConnected,
    ]
  );

  const mongodb_find_collections = (input: MongodbFindCollectionsInput) => {
    const f = async (input: MongodbFindCollectionsInput) => {
      try {
        setCollectionsLoading(CONTAINER_STATES.LOADING);
        setCollections([]);
        setCollectionName("");
        const collections = await invoke<
          CollectionSpecification[],
          MongodbFindCollectionsInput
        >("mongodb_find_collections", input);
        setCollectionsLoading(CONTAINER_STATES.LOADED);
        setCollections(collections);
      } catch (error) {
        console.error(error);
      }
    };
    f(input);
  };

  const mongodb_find_documents = useMemo(
    () =>
      debounce((input: MongodbFindDocumentsInput) => {
        const f = async () => {
          try {
            documentsTab.setLoading(true);
            documentsTab.setDocuments([]);
            const documents = await invoke<
              BsonDocument[],
              MongodbFindDocumentsInput
            >("mongodb_find_documents", input);
            const documentCount = await invoke<
              number,
              MongodbDocumentCountInput
            >("mongodb_count_documents", input);
            documentsTab.setLoading(false);
            documentsTab.setDocuments(documents);
            documentsTab.setDocumentsCount(documentCount);
          } catch (error) {
            console.error(error);
          }
        };
        f();
      }),
    [documentsTab]
  );

  const mongodb_aggregate_documents = useMemo(
    () =>
      debounce(() => {
        const f = async () => {
          try {
            aggregateTab.setLoading(true);
            if (aggregateTab.sampleCount > 0) {
              const result = await Promise.all(
                aggregateTab.stages
                  .map((_a, idx) =>
                    aggregateTab.stages.filter((_b, idx2) => idx2 <= idx)
                  )
                  .map(async (stages) => {
                    const aggregationStages = stages.map(
                      ({ stageOperation, stageBody }) => ({
                        [stageOperation]: JSON.parse(stageBody),
                      })
                    );
                    const documents = await invoke<
                      BsonDocument[],
                      MongodbAggregateDocumentsInput
                    >("mongodb_aggregate_documents", {
                      databaseName,
                      collectionName,
                      stages: [
                        { $limit: aggregateTab.sampleCount },
                        ...aggregationStages,
                      ],
                    });
                    return {
                      collapsed: false,
                      stageOperation: stages[stages.length - 1].stageOperation,
                      stageBody: stages[stages.length - 1].stageBody,
                      documents,
                    };
                  })
              );
              aggregateTab.setLoading(false);
              aggregateTab.setStages(result);
            } else {
              aggregateTab.setLoading(false);
              aggregateTab.setStages((stages) =>
                stages.map((d) => ({
                  ...d,
                  documents: [],
                }))
              );
            }
          } catch (error) {
            console.error("mongodb_aggregate_documents", error);
          }
        };
        f();
      }),
    [aggregateTab, collectionName, databaseName]
  );

  return {
    functions: {
      mongodb_connect,
      mongodb_find_collections,
      mongodb_find_documents,
      mongodb_aggregate_documents,
    },
    connectionData,
    documentsTab,
    aggregateTab,
  };
};

export type AppState = ReturnType<typeof useAppState>;

const invoke: <O, T = Record<string, unknown>>(
  name: string,
  payload: T
) => Promise<O> =
  // @ts-ignore
  window.__TAURI__.invoke;

const App = () => {
  const appStates = useAppState();
  const {
    connectionData: { databaseName, collectionName },
  } = appStates;

  return (
    <div
      style={{
        display: "flex",
        padding: "5px",
        rowGap: "5px",
        flexDirection: "column",
      }}
    >
      <MongoDbUrlBar appStates={appStates} />
      <div hidden={databaseName && collectionName ? false : true}>
        <Tabs defaultActiveKey="document_listing_tab">
          <Tab eventKey="document_listing_tab" title="Documents">
            <DocumentListing appStates={appStates} />
          </Tab>
          <Tab eventKey="document_aggregation_tab" title="Aggregation">
            <DocumentAggregation appStates={appStates} />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default App;
