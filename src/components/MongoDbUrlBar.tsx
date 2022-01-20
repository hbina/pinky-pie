import React, { useEffect, useState } from "react";
import { Spinner, Form, InputGroup } from "react-bootstrap";

import {
  VALUE_STATES,
  CollectionSpecification,
  DatabaseSpecification,
} from "../types";
import { AppState } from "../App";
import { ServerInfo } from "./ServerInfo";
import { mongodb_connect, mongodb_find_collections } from "../util";

export type MongodbUrlBarProps = {
  url: string;
  port: number;
  status: VALUE_STATES;
  databases: DatabaseSpecification[];
  databasesState: VALUE_STATES;
  databaseName: string | undefined;
  collections: CollectionSpecification[];
  collectionsState: VALUE_STATES;
  collectionName: string | undefined;
};

export const MONGODB_URL_BAR_INITIAL_STATE: MongodbUrlBarProps = {
  url: "localhost",
  port: 27017,
  status: VALUE_STATES.UNLOADED,
  databases: [],
  databasesState: VALUE_STATES.UNLOADED,
  databaseName: undefined,
  collections: [],
  collectionsState: VALUE_STATES.UNLOADED,
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
        status: connectionState,
        databases,
        databasesState,
        databaseName,
        collections,
        collectionsState,
        collectionName,
      },
      setState,
    },
    documentsTabState: { setState: setDocumentsTabState },
    serverInfoState: { setState: setServerInfoState },
    aggregateTabState: { setStagesOutput: setAggregateTabStagesOutputState },
    schemaTabState: { setState: setSchemaTabState },
  } = appStates;

  useEffect(() => {
    const f = async () => {
      if (url && port && connectionState === VALUE_STATES.UNLOADED) {
        try {
          setState((state) => ({
            ...state,
            status: VALUE_STATES.LOADING,
            databases: [],
            databasesState: VALUE_STATES.LOADING,
            databaseName: undefined,
            collections: [],
            collectionsState: VALUE_STATES.UNLOADED,
            collectionName: undefined,
          }));
          const databases = await mongodb_connect({
            url,
            port,
          });
          setState((state) => ({
            ...state,
            status: VALUE_STATES.LOADED,
            databases,
            databasesState: VALUE_STATES.LOADED,
          }));
        } catch (error) {
          console.error(error);
          setState(MONGODB_URL_BAR_INITIAL_STATE);
        }
      }
    };
    f();
  }, [url, port, connectionState, setState]);

  useEffect(() => {
    const f = async () => {
      if (databaseName) {
        try {
          setState((state) => ({
            ...state,
            collectionsState: VALUE_STATES.LOADING,
            collections: [],
            collectionName: undefined,
          }));
          const collections = await mongodb_find_collections({
            databaseName,
          });
          setState((state) => ({
            ...state,
            collectionsState: VALUE_STATES.LOADED,
            collections: collections,
          }));
        } catch (error) {
          console.error(error);
          setState(MONGODB_URL_BAR_INITIAL_STATE);
        }
      }
    };
    f();
  }, [databaseName, setState]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          columnGap: "5px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
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
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px",
          }}
        >
          {/* CONNECT BUTTON */}
          <button
            disabled={connectionState === VALUE_STATES.LOADING}
            style={{
              display: "flex",
              alignItems: "center",
              height: "30px",
            }}
            onClick={() =>
              setState((state) => ({
                ...state,
                status: VALUE_STATES.UNLOADED,
              }))
            }
          >
            Connect
          </button>
          {/* DATABASES SELECT */}
          <>
            {databasesState === VALUE_STATES.UNLOADED && <div></div>}
            {databasesState === VALUE_STATES.LOADING && (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            )}
            {databasesState === VALUE_STATES.LOADED &&
              databases.length === 0 && <div>No databases available</div>}
            {databasesState === VALUE_STATES.LOADED && databases.length !== 0 && (
              <select
                name={databaseName}
                onChange={(value) =>
                  setState((state) => ({
                    ...state,
                    databaseName: value.target.value,
                  }))
                }
              >
                {!databaseName && <option key={0} value={undefined}></option>}
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
            {collectionsState === VALUE_STATES.UNLOADED && <div></div>}
            {collectionsState === VALUE_STATES.LOADING && (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            )}
            {collectionsState === VALUE_STATES.LOADED && (
              <select
                name={collectionName}
                onChange={(value) => {
                  setState((state) => ({
                    ...state,
                    collectionName: value.target.value,
                  }));
                  setDocumentsTabState((state) => ({
                    ...state,
                    status: VALUE_STATES.UNLOADED,
                  }));
                  setAggregateTabStagesOutputState((state) =>
                    state.map((s) => ({
                      ...s,
                      status: VALUE_STATES.UNLOADED,
                    }))
                  );
                  setSchemaTabState((state) => ({
                    ...state,
                    status: VALUE_STATES.UNLOADED,
                  }));
                }}
              >
                {!collectionName && <option key={0} value={undefined}></option>}
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
              hidden={connectionState !== VALUE_STATES.LOADED}
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
        </div>
      </div>
    </div>
  );
};
