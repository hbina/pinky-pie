import "bootstrap/dist/css/bootstrap.min.css";

import { useCallback, useState } from "react";
import ReactJson from "react-json-view";
import { debounce } from "lodash";

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
import { Card, Spinner } from "react-bootstrap";

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
        const response = await invoke<CollectionSpecification[]>(
          "list_collections",
          input
        );
        console.log("list_collections", response);
        setLoading(false);
        setDatabaseCollections((curr) => ({
          ...curr,
          [input.databaseName]: response,
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
        const response = await invoke<BsonDocument[]>("list_documents", input);
        console.log("list_documents", response);
        setLoading(false);
        setCollectionDocuments(response);
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
      />
      <div>
        {loading && (
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        )}
        {!loading &&
          collectionDocuments.map((document, idx) => (
            <div key={idx}>
              <Card>
                <Card.Body>
                  <ReactJson src={document} collapsed={1} />
                </Card.Body>
              </Card>
            </div>
          ))}
      </div>
    </div>
  );
};

export default App;
