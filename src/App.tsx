import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import ReactJson from "react-json-view";
import { debounce } from "lodash";

import MongoDbUrlBar from "./components/MongoDbUrlBar";
import DatabaseCollectionBar from "./components/DatabaseCollectionBar";
import {
  DatabaseSpecification,
  CollectionSpecification,
  BsonDocument,
} from "./types";
import { Card } from "react-bootstrap";

const invoke: <O>(
  name: string,
  payload: Record<string, unknown>
) => Promise<O> =
  // @ts-ignore
  window.__TAURI__.invoke;

const App = () => {
  const [url, setUrl] = React.useState("mongodb://localhost:27017");
  const [databases, setDatabases] = React.useState<DatabaseSpecification[]>([]);
  const [databaseCollections, setDatabaseCollections] = React.useState<
    Record<string, CollectionSpecification[]>
  >({});
  const [collectionDocuments, setCollectionDocuments] = React.useState<
    BsonDocument[]
  >([]);

  const connect_mongodb = debounce(async (mongodbUrl: string) => {
    try {
      const response = await invoke<DatabaseSpecification[]>(
        "connect_mongodb",
        {
          mongodbUrl,
        }
      );
      console.log("connect_mongodb", response);
      setDatabases(response);
    } catch (error) {
      console.error(error);
    }
  }, 2000);

  const list_collections = debounce(async (databaseName: string) => {
    try {
      const response = await invoke<CollectionSpecification[]>(
        "list_collections",
        {
          databaseName,
        }
      );
      console.log("list_collections", response);
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
        const response = await invoke<BsonDocument[]>("list_documents", {
          databaseName,
          collectionName,
          page,
          perPage,
        });
        console.log(
          "list_documents",
          {
            databaseName,
            collectionName,
            page,
            perPage,
          },
          response
        );
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
        {collectionDocuments.map((document, idx) => (
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
