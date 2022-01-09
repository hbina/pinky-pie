import { useState } from "react";
import { Button, Dropdown, Spinner, Form, InputGroup } from "react-bootstrap";

import { AppState } from "../App";
import {
  CONTAINER_STATES,
  CollectionSpecification,
  DatabaseSpecification,
  CONTAINER_STATUS,
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
  const HEIGHT = "30px";
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
    serverInfoState: { setShow },
  } = appStates;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        height: HEIGHT,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          columnGap: "5px",
          height: HEIGHT,
        }}
      >
        <Form
          style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px",
            justifyContent: "flex-start",
            height: HEIGHT,
          }}
          noValidate
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              width: "300px",
              height: HEIGHT,
            }}
          >
            <InputGroup.Text
              style={{
                width: "110px",
                height: HEIGHT,
              }}
            >
              mongodb://
            </InputGroup.Text>
            <Form.Control
              style={{
                width: "100px",
                height: HEIGHT,
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
                height: HEIGHT,
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
            height: HEIGHT,
          }}
        >
          <Button
            style={{
              display: "flex",
              alignItems: "center",
              height: HEIGHT,
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
                  height: HEIGHT,
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
                  height: HEIGHT,
                }}
              >
                {collectionName}
              </Dropdown.Toggle>
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
