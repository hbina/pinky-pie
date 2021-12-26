import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { Button, Accordion, ButtonGroup } from "react-bootstrap";
import ReactJson from "react-json-view";

import styles from "./App.module.css";
import TopNavBar from "./components/TopNavBar";
import LeftNavBar from "./components/LeftNavBar";

const invoke: <O>(
  name: string,
  payload: Record<string, unknown>
) => Promise<O> =
  // @ts-ignore
  window.__TAURI__.invoke;

type DatabaseSpecification = Readonly<{
  name: string;
  sizeOnDisk: number;
  empty: boolean;
  shards?: Record<string, unknown>;
}>;

type CollectionSpecification = Readonly<{
  name: string;
  type: string;
}>;

type BsonDocument = Readonly<Record<string, unknown>>;

const App = () => {
  const [url, setUrl] = React.useState("mongodb://localhost:27017");
  const [disableInput, setDisableInput] = React.useState(false);
  const [databases, setDatabases] = React.useState<DatabaseSpecification[]>([]);
  const [databaseCollections, setDatabaseCollections] = React.useState<
    Record<string, CollectionSpecification[]>
  >({});
  const [collectionDocuments, setCollectionDocuments] = React.useState<
    BsonDocument[]
  >([]);

  const connect_mongodb = async (mongodbUrl: string) => {
    try {
      const response = await invoke<DatabaseSpecification[]>(
        "connect_mongodb",
        {
          mongodbUrl,
        }
      );
      console.log("connect_mongodb", response);
      setDatabases(response);
      setDisableInput(true);
    } catch (error) {
      console.error(error);
    }
  };

  const list_collections = async (databaseName: string) => {
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
  };

  const list_documents = async (
    databaseName: string,
    collectionName: string
  ) => {
    try {
      const response = await invoke<BsonDocument[]>("list_documents", {
        databaseName,
        collectionName,
      });
      console.log("list_documents", response);
      setCollectionDocuments(response);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.AppContainer}>
      <TopNavBar
        url={url}
        setUrl={setUrl}
        disableInput={disableInput}
        connect_mongodb={connect_mongodb}
      />
      <div className={styles.BottomBox}>
        <LeftNavBar
          databases={databases}
          databaseCollections={databaseCollections}
          list_collections={list_collections}
          list_documents={list_documents}
        />
        <div className={styles.RightBox}>
          {collectionDocuments.map((document, idx) => (
            <div key={idx}>
              <ReactJson src={document} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
