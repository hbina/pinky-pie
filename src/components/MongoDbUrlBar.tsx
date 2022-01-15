import { useState } from "react";
import { Button, Dropdown, Spinner, Form, InputGroup } from "react-bootstrap";

import {
  CONTAINER_STATES,
  CollectionSpecification,
  DatabaseSpecification,
  CONTAINER_STATUS,
  AppState,
} from "../types";
import { ServerInfo } from "./ServerInfo";

export const useMongodbUrlBarState = () => {
  const [url, setUrl] = useState("localhost");
  const [port, setPort] = useState(27017);
  const [urlConnected, setUrlConnected] = useState(false);
  const [databases, setDatabases] = useState<DatabaseSpecification[]>([]);
  const [collections, setCollections] = useState<CollectionSpecification[]>([]);
  const [databasesLoading, setDatabasesState] = useState(
    CONTAINER_STATES.HIDDEN
  );
  const [collectionsLoading, setCollectionsLoading] = useState(
    CONTAINER_STATES.HIDDEN
  );
  const [databaseName, setDatabaseName] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [buttonStatus, setButtonStatus] = useState(CONTAINER_STATUS.ENABLED);

  return {
    url,
    setUrl,
    port,
    setPort,
    urlConnected,
    setUrlConnected,
    databases,
    setDatabases,
    databasesLoading,
    setDatabasesState,
    collectionsLoading,
    setCollectionsLoading,
    databaseName,
    setDatabaseName,
    collectionName,
    setCollectionName,
    collections,
    setCollections,
    buttonStatus,
    setButtonStatus,
  };
};

export const MongoDbUrlBar = ({
  appStates,
}: Readonly<{ appStates: AppState }>) => {
  const {
    functions: {
      mongodb_connect,
      mongodb_find_collections,
      mongodb_find_documents,
      mongodb_server_description,
    },
    connectionData: {
      url,
      setUrl,
      port,
      setPort,
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
    documentsTabState: { setPage },
    serverInfoState: { setShow },
    schemaTabState: { setDocuments, setDocumentsFilter },
  } = appStates;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          columnGap: "5px",
        }}
      >
        <Form
          style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px",
            justifyContent: "flex-start",
          }}
          noValidate
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            <InputGroup.Text
              style={{
                width: "110px",
                height: "30px",
              }}
            >
              mongodb://
            </InputGroup.Text>
            <Form.Control
              style={{
                width: "100px",
                height: "30px",
              }}
              required
              type="text"
              value={url}
              placeholder="localhost"
              onChange={(e) => setUrl(e.target.value)}
            />
            <Form.Control
              style={{
                width: "90px",
                height: "30px",
              }}
              required
              type="number"
              value={port}
              placeholder="27017"
              onChange={(e) => setPort(parseInt(e.target.value))}
            />
          </div>
        </Form>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px",
          }}
        >
          <Button
            style={{
              display: "flex",
              alignItems: "center",
              height: "30px",
            }}
            variant="primary"
            onClick={() => {
              if (urlConnected) {
                setShow(true);
                mongodb_server_description({
                  mongodbUrl: url,
                  mongodbPort: port,
                });
              } else {
                mongodb_connect({
                  mongodbUrl: url,
                  mongodbPort: port,
                });
              }
            }}
          >
            {urlConnected ? "Server Info" : "Connect"}
          </Button>
          <ServerInfo appStates={appStates} />
          {databasesLoading === CONTAINER_STATES.LOADING && (
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          )}
          {databasesLoading === CONTAINER_STATES.LOADED && (
            <Dropdown>
              <Dropdown.Toggle
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "30px",
                }}
              >
                {databaseName}
              </Dropdown.Toggle>
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
              <Dropdown.Toggle
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "30px",
                }}
              >
                {collectionName}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {collections.map(({ name }) => (
                  <Dropdown.Item
                    key={name}
                    onClick={() => {
                      setPage(0);
                      setCollectionName(name);
                      setDocuments([]);
                      setDocumentsFilter({});
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
