import { useState } from "react";
import {
  Button,
  Dropdown,
  Spinner,
  Form,
  InputGroup,
  Modal,
} from "react-bootstrap";
import ReactJson from "react-json-view";

import { AppState } from "../App";
import {
  CONTAINER_STATES,
  CollectionSpecification,
  DatabaseSpecification,
  CONTAINER_STATUS,
  MongodbServerInformation,
} from "../types";

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
  const [serverInformation, setServerInformation] = useState<
    MongodbServerInformation | undefined
  >(undefined);

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
    serverInformation,
    setServerInformation,
  };
};

export const MongoDbUrlBar = ({
  appStates: {
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
      serverInformation,
    },
  },
}: Readonly<{ appStates: AppState }>) => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

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
              width: "300px",
            }}
          >
            <InputGroup.Text
              style={{
                minWidth: "110px",
              }}
            >
              mongodb://
            </InputGroup.Text>
            <Form.Control
              style={{
                minWidth: "100px",
              }}
              required
              type="text"
              value={url}
              placeholder="localhost"
              onChange={(e) => setUrl(e.target.value)}
            />
            <Form.Control
              style={{
                minWidth: "90px",
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
            variant="primary"
            onClick={() =>
              mongodb_connect({
                mongodbUrl: url,
                mongodbPort: port,
              })
            }
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
      <Button
        variant="primary"
        onClick={() => {
          handleShow();
          mongodb_server_description({
            mongodbUrl: url,
            mongodbPort: port,
          });
        }}
      >
        Info
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Server information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {serverInformation ? (
            <ReactJson name={false} src={serverInformation} />
          ) : (
            <div>Not connected to any MongoDB service.</div>
          )}
        </Modal.Body>
        <Modal.Footer>App by Hanif Bin Ariffin</Modal.Footer>
      </Modal>
    </div>
  );
};
