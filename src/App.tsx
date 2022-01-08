import "bootstrap/dist/css/bootstrap.min.css";

import { Tab, Tabs } from "react-bootstrap";
import { cloneDeep } from "lodash";

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
  CONTAINER_STATUS,
  MongodbServerInformation,
  MongodbAnalyzeDocumentInput,
  MongodbAnalyzeDocumentOutput,
} from "./types";
import {
  MongoDbUrlBar,
  useMongodbUrlBarState,
} from "./components/MongoDbUrlBar";
import { DocumentsTab, useDocumentsTabState } from "./components/DocumentsTab";
import { AggregateTab, useAggregateTabState } from "./components/AggregateTab";
import { useServerInfoState } from "./components/ServerInfo";
import { SchemaTab, useSchemaTabState } from "./components/SchemaTab";

export const useAppState = () => {
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
          DatabaseSpecification[],
          MongodbConnectInput
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
          CollectionSpecification[],
          MongodbFindCollectionsInput
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
        const documents = await invoke<
          BsonDocument[],
          MongodbFindDocumentsInput
        >("mongodb_find_documents", input);
        const documentCount = await invoke<number, MongodbDocumentCountInput>(
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
            BsonDocument[],
            {
              databaseName: string;
              collectionName: string;
              stages: Record<string, unknown>[];
            }
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
        MongodbServerInformation,
        MongodbConnectInput
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
        MongodbAnalyzeDocumentOutput,
        MongodbAnalyzeDocumentInput
      >("mongodb_analyze_documents", input);
      schemaTabState.setLoading(false);
      schemaTabState.setDocuments(result);
    };
    f(input);
  };

  return {
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
            <DocumentsTab appStates={appStates} />
          </Tab>
          <Tab eventKey="document_aggregation_tab" title="Aggregation">
            <AggregateTab appStates={appStates} />
          </Tab>
          <Tab eventKey="document_schema_tab" title="Schema">
            <SchemaTab appStates={appStates} />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default App;
