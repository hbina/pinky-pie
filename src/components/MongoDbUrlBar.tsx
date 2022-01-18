import { invoke } from "@tauri-apps/api";
import React, { useState, useEffect } from "react";
import { Spinner, Form, InputGroup, Stack } from "react-bootstrap";

import {
  CONTAINER_STATES,
  CollectionSpecification,
  DatabaseSpecification,
  AppState,
} from "../types";
import { ServerInfo } from "./ServerInfo";

export type MongodbUrlBarProps = {
  url: string;
  port: number;
  connectionState: CONTAINER_STATES;
  databases: DatabaseSpecification[];
  databasesLoading: CONTAINER_STATES;
  databaseName: string | undefined;
  collections: CollectionSpecification[];
  collectionsLoading: CONTAINER_STATES;
  collectionName: string | undefined;
};

export const MONGODB_URL_BAR_INITIAL_STATE: MongodbUrlBarProps = {
  url: "localhost",
  port: 27017,
  connectionState: CONTAINER_STATES.UNLOADED,
  databases: [],
  databasesLoading: CONTAINER_STATES.UNLOADED,
  databaseName: undefined,
  collections: [],
  collectionsLoading: CONTAINER_STATES.UNLOADED,
  collectionName: undefined,
};

export const useMongodbUrlBarState = () => {
  const [state, setState] = useState<MongodbUrlBarProps>(
    MONGODB_URL_BAR_INITIAL_STATE
  );
  return {
    state,
    setState,
  };
};

export const MongoDbUrlBar = ({
  appStates,
}: Readonly<{ appStates: AppState }>) => {
  const {
    connectionData: {
      state: {
        url,
        port,
        connectionState,
        databases,
        databasesLoading,
        databaseName,
        collections,
        collectionsLoading,
        collectionName,
      },
      setState,
    },
    serverInfoState: { setState: setServerInfoState },
  } = appStates;

  useEffect(() => {
    const f = async () => {
      try {
        if (connectionState === CONTAINER_STATES.UNLOADED) {
          setState((state) => ({
            ...state,
            connectionState: CONTAINER_STATES.LOADING,
            databases: [],
            databasesLoading: CONTAINER_STATES.LOADING,
            databaseName: undefined,
            collections: [],
            collectionsLoading: CONTAINER_STATES.UNLOADED,
            collectionName: undefined,
          }));
          const databases = await invoke<DatabaseSpecification[]>(
            "mongodb_connect",
            {
              url,
              port,
            }
          );
          setState((state) => ({
            ...state,
            connectionState: CONTAINER_STATES.LOADED,
            databases,
            databasesLoading: CONTAINER_STATES.LOADED,
            databaseName: databases[0] ? databases[0].name : undefined,
          }));
        }
      } catch (error) {
        console.error(error);
        setState(MONGODB_URL_BAR_INITIAL_STATE);
      }
    };
    f();
  }, [url, port, connectionState, setState]);

  useEffect(() => {
    const f = async () => {
      try {
        if (collectionsLoading === CONTAINER_STATES.UNLOADED && databaseName) {
          setState((state) => ({
            ...state,
            collectionsLoading: CONTAINER_STATES.LOADING,
            collections: [],
            collectionName: undefined,
          }));
          const collections = await invoke<CollectionSpecification[]>(
            "mongodb_find_collections",
            {
              databaseName,
            }
          );
          setState((state) => ({
            ...state,
            collectionsLoading: CONTAINER_STATES.LOADED,
            collections: collections,
            collectionName: collections[0] ? collections[0].name : undefined,
          }));
        }
      } catch (error) {
        console.error(error);
        setState(MONGODB_URL_BAR_INITIAL_STATE);
      }
    };
    f();
  }, [collectionsLoading, databaseName, setState]);

  return (
    <Stack
      direction="horizontal"
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <Stack
        direction="horizontal"
        style={{
          display: "flex",
          justifyContent: "flex-start",
          columnGap: "5px",
        }}
      >
        <Stack
          direction="horizontal"
          style={{
            display: "flex",
            columnGap: "5px",
            justifyContent: "flex-start",
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
            onChange={(e) =>
              setState((state) => ({
                ...state,
                url: e.target.value,
              }))
            }
          />
          <Form.Control
            style={{
              width: "90px",
              height: "30px",
            }}
            required
            type="number"
            value={port}
            onChange={(e) =>
              setState((state) => ({
                ...state,
                port: parseInt(e.target.value),
              }))
            }
          />
        </Stack>
        <Stack
          direction="horizontal"
          style={{
            display: "flex",
            columnGap: "5px",
          }}
        >
          {/* CONNECT BUTTON */}
          <button
            disabled={connectionState === CONTAINER_STATES.LOADING}
            style={{
              display: "flex",
              alignItems: "center",
              height: "30px",
            }}
            onClick={() =>
              setState((state) => ({
                ...state,
                connectionState: CONTAINER_STATES.UNLOADED,
              }))
            }
          >
            Connect
          </button>
          {/* DATABASES SELECT */}
          <>
            {databasesLoading === CONTAINER_STATES.LOADING && (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            )}
            {databasesLoading === CONTAINER_STATES.LOADED &&
              databases.length === 0 && <div>No databases available</div>}
            {databasesLoading === CONTAINER_STATES.LOADED &&
              databases.length !== 0 && (
                <select
                  name={databaseName ?? "No databse selected"}
                  onChange={(value) => {
                    const name = value.target.value;
                    setState((state) => ({
                      ...state,
                      databaseName: name,
                      databasesLoading: CONTAINER_STATES.UNLOADED,
                    }));
                  }}
                >
                  {databases.map(({ name }) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
          </>
          {/* COLLECTIONS SELECT */}
          <>
            {collectionsLoading === CONTAINER_STATES.LOADING && (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            )}
            {collectionsLoading === CONTAINER_STATES.LOADED && (
              <select
                name={collectionName ?? "No collection selected"}
                onChange={(value) => {
                  const name = value.target.value;
                  setState((state) => ({
                    ...state,
                    collectionName: name,
                    databasesLoading: CONTAINER_STATES.UNLOADED,
                  }));
                }}
              >
                {collections.map(({ name }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </>
          {/* SERVER INFO BUTTON */}
          <>
            <button
              hidden={connectionState !== CONTAINER_STATES.LOADED}
              style={{
                display: "flex",
                alignItems: "center",
                height: "30px",
              }}
              onClick={() =>
                setServerInfoState((state) => ({
                  ...state,
                  visible: true,
                }))
              }
            >
              Server Info
            </button>
            <ServerInfo appStates={appStates} />
          </>
        </Stack>
      </Stack>
    </Stack>
  );
};
