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
} from "./types";
import { Tab, Tabs } from "react-bootstrap";
import DocumentListing from "./components/DocumentListing";
import { debounce } from "lodash";

const invoke: <O>(
  name: string,
  payload: Record<string, unknown>
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
  const [collectionDocuments, setCollectionDocuments] = useState<
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

  const connect_mongodb = useCallback((input: MongodbConnectInput) => {
    const f = async (input: MongodbConnectInput) => {
      try {
        setLoading(true);
        const response = await invoke<DatabaseSpecification[]>(
          "connect_mongodb",
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

  const list_collections = useCallback((input: ListCollectionsInput) => {
    const f = async (input: ListCollectionsInput) => {
      try {
        setLoading(true);
        const collections = await invoke<CollectionSpecification[]>(
          "list_collections",
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

  const list_documents = useMemo(
    () =>
      debounce((input: ListDocumentsInput) => {
        const f = async (input: ListDocumentsInput) => {
          try {
            setLoading(true);
            const documents = await invoke<BsonDocument[]>(
              "list_documents",
              input
            );
            const estimatedDocumentCount = await invoke<number>(
              "count_documents",
              input
            );
            setLoading(false);
            setCollectionDocuments(documents);
            setDocumentsCount(estimatedDocumentCount);
          } catch (error) {
            console.error(error);
          }
        };
        f(input);
      }, 1000),
    []
  );

  useEffect(() => {
    if (databaseName && collectionName)
      list_documents({
        databaseName,
        collectionName,
        page,
        perPage,
        documentsFilter,
        documentsProjection,
        documentsSort,
      });
  }, [
    list_documents,
    databaseName,
    collectionName,
    page,
    perPage,
    documentsFilter,
    documentsProjection,
    documentsSort,
  ]);

  useEffect(() => {
    if (databaseName) list_collections({ databaseName });
  }, [databaseName, list_collections]);

  return (
    <div>
      {!urlConnected ? (
        <MongoDbUrlBar
          url={url}
          setUrl={setUrl}
          connect_mongodb={connect_mongodb}
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
                documents={collectionDocuments}
                setDocumentsFilter={setDocumentsFilter}
                setDocumentsProjection={setDocumentsProjection}
                setDocumentsSort={setDocumentsSort}
              />
            </Tab>
            <Tab eventKey="document_aggregation_tab" title="Aggregation">
              <p>hello world</p>
            </Tab>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default App;
