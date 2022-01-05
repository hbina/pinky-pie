import { useState } from "react";
import { Button, Dropdown, Spinner } from "react-bootstrap";

import { AppState } from "../App";
import {
  CONTAINER_STATES,
  CollectionSpecification,
  DatabaseSpecification,
} from "../types";

export const useMongodbUrlBarState = () => {
  const [url, setUrl] = useState("mongodb://localhost:27017");
  const [urlConnected, setUrlConnected] = useState(false);
  const [databases, setDatabases] = useState<DatabaseSpecification[]>([]);
  const [collections, setCollections] = useState<CollectionSpecification[]>([]);
  const [databasesLoading, setDatabasesLoading] = useState(
    CONTAINER_STATES.HIDDEN
  );
  const [collectionsLoading, setCollectionsLoading] = useState(
    CONTAINER_STATES.HIDDEN
  );
  const [databaseName, setDatabaseName] = useState("");
  const [collectionName, setCollectionName] = useState("");
  return {
    url,
    setUrl,
    urlConnected,
    setUrlConnected,
    databases,
    setDatabases,
    databasesLoading,
    setDatabasesLoading,
    collectionsLoading,
    setCollectionsLoading,
    databaseName,
    setDatabaseName,
    collectionName,
    setCollectionName,
    collections,
    setCollections,
  };
};

const MongoDbUrlBar = ({
  appStates: {
    functions: {
      mongodb_connect,
      mongodb_find_collections,
      mongodb_find_documents,
    },
    connectionData: {
      url,
      setUrl,
      urlConnected,
      databaseName,
      setDatabaseName,
      collectionName,
      setCollectionName,
      databasesLoading,
      collectionsLoading,
      databases,
      collections,
    },
  },
}: Readonly<{ appStates: AppState }>) => {
  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          columnGap: "5px",
        }}
      >
        <input
          style={{
            display: "flex",
            width: "250px",
          }}
          disabled={urlConnected}
          value={url}
          placeholder="MongoDB URL"
          onChange={(e) => setUrl(e.target.value)}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px",
          }}
        >
          <Button
            variant="primary"
            onClick={() => mongodb_connect({ mongodbUrl: url })}
          >
            Connect
          </Button>
          {databasesLoading === CONTAINER_STATES.LOADING && (
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          )}
          {databasesLoading === CONTAINER_STATES.LOADED && (
            <Dropdown>
              <Dropdown.Toggle>{databaseName}</Dropdown.Toggle>
              <Dropdown.Menu>
                {databases.map(({ name }) => (
                  <Dropdown.Item
                    key={name}
                    onClick={() => {
                      setDatabaseName(name);
                      mongodb_find_collections({
                        databaseName: name,
                      });
                    }}
                  >
                    {name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          )}
          {collectionsLoading === CONTAINER_STATES.LOADING && (
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          )}
          {collectionsLoading === CONTAINER_STATES.LOADED && (
            <Dropdown>
              <Dropdown.Toggle>{collectionName}</Dropdown.Toggle>
              <Dropdown.Menu>
                {collections.map(({ name }) => (
                  <Dropdown.Item
                    key={name}
                    onClick={() => {
                      setCollectionName(name);
                      mongodb_find_documents({
                        databaseName,
                        collectionName: name,
                        page: 0,
                        perPage: 20,
                        documentsFilter: {},
                        documentsSort: {},
                        documentsProjection: {},
                      });
                    }}
                  >
                    {name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default MongoDbUrlBar;
