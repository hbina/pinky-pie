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
  databasesLoading: VALUE_STATES;
  databaseName: string | undefined;
  collections: CollectionSpecification[];
  collectionsLoading: VALUE_STATES;
  collectionName: string | undefined;
};

export const MONGODB_URL_BAR_INITIAL_STATE: MongodbUrlBarProps = {
  url: "localhost",
  port: 27017,
  status: VALUE_STATES.UNLOADED,
  databases: [],
  databasesLoading: VALUE_STATES.UNLOADED,
  databaseName: undefined,
  collections: [],
  collectionsLoading: VALUE_STATES.UNLOADED,
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
        setState((state) => ({
          ...state,
          status: VALUE_STATES.LOADING,
          databases: [],
          databasesLoading: VALUE_STATES.LOADING,
          databaseName: undefined,
          collections: [],
          collectionsLoading: VALUE_STATES.UNLOADED,
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
          databasesLoading: VALUE_STATES.LOADED,
        }));
      } catch (error) {
        console.error(error);
        setState(MONGODB_URL_BAR_INITIAL_STATE);
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
            collectionsLoading: VALUE_STATES.LOADING,
            collections: [],
            collectionName: undefined,
          }));
          const collections = await mongodb_find_collections({
            databaseName,
          });
          setState((state) => ({
            ...state,
            collectionsLoading: VALUE_STATES.LOADED,
            collections: collections,
          }));
        } catch (error) {
          console.error(error);
          setState(MONGODB_URL_BAR_INITIAL_STATE);
        }
      }
    };
    f();
  }, [databaseName, collectionsLoading, setState]);

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
            {databasesLoading === VALUE_STATES.LOADING && (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            )}
            {databasesLoading === VALUE_STATES.LOADED &&
              databases.length === 0 && <div>No databases available</div>}
            {databasesLoading === VALUE_STATES.LOADED &&
              databases.length !== 0 && (
                <select
                  name={databaseName}
                  onChange={(value) =>
                    setState((state) => ({
                      ...state,
                      databaseName: value.target.value,
                    }))
                  }
                >
                  <option key={0} value={undefined}>
                    -
                  </option>
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
            {collectionsLoading === VALUE_STATES.LOADING && (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            )}
            {collectionsLoading === VALUE_STATES.LOADED && (
              <select
                name={collectionName}
                onChange={(value) =>
                  setState((state) => ({
                    ...state,
                    collectionName: value.target.value,
                  }))
                }
              >
                <option key={0} value={undefined}>
                  -
                </option>
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
