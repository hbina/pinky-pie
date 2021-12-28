import "bootstrap/dist/css/bootstrap.min.css";

import { useState } from "react";
import ReactJson from "react-json-view";
import { debounce } from "lodash";

import MongoDbUrlBar from "./components/MongoDbUrlBar";
import DatabaseCollectionBar from "./components/DatabaseCollectionBar";
import {
  DatabaseSpecification,
  CollectionSpecification,
  BsonDocument,
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

  const connect_mongodb = debounce(async (mongodbUrl: string) => {
    try {
      setLoading(true);
      const response = await invoke<DatabaseSpecification[]>(
        "connect_mongodb",
        {
          mongodbUrl,
        }
      );
      setLoading(false);
      setDatabases(response);
    } catch (error) {
      console.error(error);
    }
  }, 2000);

  const list_collections = debounce(async (databaseName: string) => {
    try {
      setLoading(true);
      const response = await invoke<CollectionSpecification[]>(
        "list_collections",
        {
          databaseName,
        }
      );
      setLoading(false);
      setDatabaseCollections((curr) => ({
        ...curr,
        [databaseName]: response,
      }));
    } catch (error) {
      console.error(error);
    }
  }, 2000);

  const list_documents = debounce(
    async (
      databaseName: string,
      collectionName: string,
      page: number,
      perPage: number
    ) => {
      try {
        setLoading(true);
        const response = await invoke<BsonDocument[]>("list_documents", {
          databaseName,
          collectionName,
          page,
          perPage,
        });
        setLoading(false);
        setCollectionDocuments(response);
      } catch (error) {
        console.error(error);
      }
    },
    2000
  );

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
                  <ReactJson src={document} />
                </Card.Body>
              </Card>
            </div>
          ))}
      </div>
    </div>
  );
};

export default App;
