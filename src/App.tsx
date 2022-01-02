import "bootstrap/dist/css/bootstrap.min.css";

import { useCallback, useMemo, useState, useEffect } from "react";

import MongoDbUrlBar from "./components/MongoDbUrlBar";
import DatabaseCollectionBar from "./components/DatabaseCollectionBar";
import {
  DatabaseSpecification,
  CollectionSpecification,
  BsonDocument,
  MongodbConnectInput,
  ListCollectionsInput,
  ListDocumentsInput,
  AggregationStages,
  AggregateDocumentsInput,
} from "./types";
import { Tab, Tabs } from "react-bootstrap";
import DocumentListing from "./components/DocumentListing";
import { debounce } from "lodash";
import DocumentAggregation from "./components/DocumentAggregation";

const invoke: <O, T = Record<string, unknown>>(
  name: string,
  payload: T
) => Promise<O> =
  // @ts-ignore
  window.__TAURI__.invoke;

const App = () => {
  const [url, setUrl] = useState("mongodb://localhost:27017");
  const [urlConnected, setUrlConnected] = useState(false);
  const [databases, setDatabases] = useState<DatabaseSpecification[]>([]);
  const [databaseCollections, setDatabaseCollections] = useState<
    Record<string, CollectionSpecification[]>
  >({});
  const [findDocumentsResult, setFindDocumentsResult] = useState<
    BsonDocument[]
  >([]);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [documentsFilter, setDocumentsFilter] = useState({});
  const [documentsProjection, setDocumentsProjection] = useState({});
  const [documentsSort, setDocumentsSort] = useState({});
  const [databaseName, setDatabaseName] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [perPage] = useState(5);
  const [page, setPage] = useState(0);
  const [aggregationData, setAggregationData] = useState<AggregationStages>([
    {
      stageOperation: "$match",
      stageBody: "{}",
      documents: [],
    },
  ]);

  const mongodb_connect = useCallback((input: MongodbConnectInput) => {
    const f = async (input: MongodbConnectInput) => {
      try {
        setLoading(true);
        const response = await invoke<DatabaseSpecification[]>(
          "mongodb_connect",
          input
        );
        setLoading(false);
        setDatabases(response);
        setUrlConnected(true);
      } catch (error) {
        console.error(error);
      }
    };
    f(input);
  }, []);

  const mongodb_find_colletions = useCallback((input: ListCollectionsInput) => {
    const f = async (input: ListCollectionsInput) => {
      try {
        setLoading(true);
        const collections = await invoke<CollectionSpecification[]>(
          "mongodb_find_colletions",
          input
        );
        setLoading(false);
        setDatabaseCollections((curr) => ({
          ...curr,
          [input.databaseName]: collections,
        }));
      } catch (error) {
        console.error(error);
      }
    };
    f(input);
  }, []);

  const mongodb_find_documents = useMemo(
    () =>
      debounce((input: ListDocumentsInput) => {
        const f = async (input: ListDocumentsInput) => {
          try {
            setLoading(true);
            const documents = await invoke<BsonDocument[]>(
              "mongodb_find_documents",
              input
            );
            const documentCount = await invoke<number>(
              "mongodb_count_documents",
              input
            );
            setLoading(false);
            setFindDocumentsResult(documents);
            setDocumentsCount(documentCount);
          } catch (error) {
            console.error(error);
          }
        };
        f(input);
      }, 1000),
    []
  );

  const mongodb_aggregate_documents = useMemo(
    () =>
      debounce(() => {
        const f = async () => {
          try {
            const result = await Promise.all(
              aggregationData
                .map((_a, idx) =>
                  aggregationData.filter((_b, idx2) => idx2 <= idx)
                )
                .map(async (stages, idx) => {
                  console.log("stages", stages);
                  if (stages.find((stage) => stage.stageOperation === "")) {
                    return {
                      stageOperation: stages[stages.length - 1].stageOperation,
                      stageBody: stages[stages.length - 1].stageBody,
                      documents: [],
                    };
                  } else {
                    const aggregationStages = stages
                      .filter(({ stageOperation }) => stageOperation !== "")
                      .map(({ stageOperation, stageBody }) => ({
                        [stageOperation]: JSON.parse(stageBody),
                      }));
                    console.log("aggregationStages", aggregationStages);
                    const documents = await invoke<BsonDocument[]>(
                      "mongodb_aggregate_documents",
                      {
                        databaseName,
                        collectionName,
                        aggregationStages: [
                          { $limit: 2 },
                          ...aggregationStages,
                        ],
                      }
                    );
                    return {
                      stageOperation: stages[stages.length - 1].stageOperation,
                      stageBody: stages[stages.length - 1].stageBody,
                      documents,
                    };
                  }
                })
            );
            setAggregationData(result);
          } catch (error) {
            console.error("mongodb_aggregate_documents", error);
          }
        };
        f();
      }, 1000),
    [aggregationData, collectionName, databaseName]
  );

  useEffect(() => {
    if (databaseName && collectionName)
      mongodb_find_documents({
        databaseName,
        collectionName,
        page,
        perPage,
        documentsFilter,
        documentsProjection,
        documentsSort,
      });
  }, [
    mongodb_find_documents,
    databaseName,
    collectionName,
    page,
    perPage,
    documentsFilter,
    documentsProjection,
    documentsSort,
  ]);

  useEffect(() => {
    if (databaseName) mongodb_find_colletions({ databaseName });
  }, [databaseName, mongodb_find_colletions]);

  return (
    <div>
      {!urlConnected ? (
        <MongoDbUrlBar
          url={url}
          setUrl={setUrl}
          mongodb_connect={mongodb_connect}
        />
      ) : (
        <div>
          <DatabaseCollectionBar
            url={url}
            databases={databases}
            databaseCollections={databaseCollections}
            documentsCount={documentsCount}
            databaseName={databaseName}
            setDatabaseName={setDatabaseName}
            collectionName={collectionName}
            setCollectionName={setCollectionName}
            page={page}
            setPage={setPage}
            perPage={perPage}
          />
          <Tabs defaultActiveKey="document_listing_tab">
            <Tab eventKey="document_listing_tab" title="Documents">
              <DocumentListing
                loading={loading}
                documents={findDocumentsResult}
                setDocumentsFilter={setDocumentsFilter}
                setDocumentsProjection={setDocumentsProjection}
                setDocumentsSort={setDocumentsSort}
              />
            </Tab>
            <Tab eventKey="document_aggregation_tab" title="Aggregation">
              <DocumentAggregation
                aggregationData={aggregationData}
                setAggregationData={setAggregationData}
                mongodb_aggregate_documents={mongodb_aggregate_documents}
              />
            </Tab>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default App;
