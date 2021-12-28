import "bootstrap/dist/css/bootstrap.min.css";

import { useCallback, useState } from "react";

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

const invoke: <O>(
  name: string,
  payload: Record<string, unknown>
) => Promise<O> =
  // @ts-ignore
  window.__TAURI__.invoke;

const App = () => {
  const [url, setUrl] = useState("mongodb://localhost:27017");
  const [databases, setDatabases] = useState<DatabaseSpecification[]>([]);
  const [databaseCollections, setDatabaseCollections] = useState<
    Record<string, CollectionSpecification[]>
  >({});
  const [collectionDocuments, setCollectionDocuments] = useState<
    BsonDocument[]
  >([]);
  const [estimatedDocumentCount, setEstimatedDocumentCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const connect_mongodb = useCallback((input: MongodbConnectInput) => {
    const f = async (input: MongodbConnectInput) => {
      try {
        setLoading(true);
        const response = await invoke<DatabaseSpecification[]>(
          "connect_mongodb",
          input
        );
        console.log("connect_mongodb", response);
        setLoading(false);
        setDatabases(response);
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
        console.log("list_collections", collections);
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

  const list_documents = useCallback((input: ListDocumentsInput) => {
    const f = async (input: ListDocumentsInput) => {
      try {
        setLoading(true);
        const documents = await invoke<BsonDocument[]>("list_documents", input);
        console.log("list_documents", documents);
        const estimatedDocumentCount = await invoke<number>(
          "estimated_document_count",
          input
        );
        setLoading(false);
        setCollectionDocuments(documents);
        setEstimatedDocumentCount(estimatedDocumentCount);
      } catch (error) {
        console.error(error);
      }
    };
    f(input);
  }, []);

  return (
    <div>
      <MongoDbUrlBar
        url={url}
        setUrl={setUrl}
        connect_mongodb={connect_mongodb}
      />
      <DatabaseCollectionBar
        databases={databases}
        databaseCollections={databaseCollections}
        list_collections={list_collections}
        list_documents={list_documents}
        estimatedDocumentCount={estimatedDocumentCount}
      />
      <Tabs defaultActiveKey="document_listing_tab">
        <Tab eventKey="document_listing_tab" title="Documents">
          <DocumentListing loading={loading} documents={collectionDocuments} />
        </Tab>
        <Tab eventKey="document_aggregation_tab" title="Aggregation">
          <p>hello world</p>
        </Tab>
      </Tabs>
    </div>
  );
};

export default App;
