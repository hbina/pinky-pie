import React, { useEffect, useState } from "react";
import { Spinner, Form, InputGroup } from "react-bootstrap";
import { isEmpty } from "lodash";

import { VALUE_STATES, DatabaseSpecification, DISPLAY_TYPES } from "../types";
import { AppState } from "../App";
import { mongodb_connect } from "../util";
import { DOCUMENTS_TAB_INITIATE_STATE } from "./DocumentsTab";
import {
  AGGREGATE_TAB_STAGE_INPUT_INITIAL_STATE,
  AGGREGATE_TAB_STAGE_OUTPUT_INITIAL_STATE,
} from "./AggregateTab";
import { SCHEMA_TAB_INITIAL_STATE } from "./SchemaTab";

export type MongodbUrlBarProps = {
  url: string;
  port: number;
  status: VALUE_STATES;
  databases: Record<string, DatabaseSpecification>;
  databasesState: VALUE_STATES;
  databaseName: string | undefined;
  collectionName: string | undefined;
};

export const MONGODB_URL_BAR_INITIAL_STATE: MongodbUrlBarProps = {
  url: "localhost",
  port: 27017,
  status: VALUE_STATES.UNLOADED,
  databases: {},
  databasesState: VALUE_STATES.UNLOADED,
  databaseName: undefined,
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
        status,
        databases,
        databasesState,
        databaseName,
        collectionName,
      },
      setState,
    },
    documentsTabState: { setState: setDocumentsTabState },
    aggregateTabState: {
      setStagesInput: setAggregateTabStagesInputState,
      setStagesOutput: setAggregateTabStagesOutputState,
    },
    schemaTabState: { setState: setSchemaTabState },
    setDisplay,
  } = appStates;

  useEffect(() => {
    const f = async () => {
      if (url && port && status === VALUE_STATES.UNLOADED) {
        try {
          setState((state) => ({
            ...state,
            status: VALUE_STATES.LOADING,
            databases: {},
            databasesState: VALUE_STATES.LOADING,
            databaseName: undefined,
            collectionsState: VALUE_STATES.UNLOADED,
            collectionName: undefined,
          }));
          const result = await mongodb_connect({
            url,
            port,
          });
          setState((state) => ({
            ...state,
            status: VALUE_STATES.LOADED,
            databases: result,
            databasesState: VALUE_STATES.LOADED,
          }));
        } catch (error) {
          console.error(error);
          setState(MONGODB_URL_BAR_INITIAL_STATE);
        }
      }
    };
    f();
  }, [url, port, status, setState]);

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
            disabled={status === VALUE_STATES.LOADING}
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
            {status === VALUE_STATES.LOADED ? "Refresh" : "Connect"}
          </button>
          {/* DATABASES SELECT */}
          <>
            {databasesState === VALUE_STATES.UNLOADED && <div></div>}
            {databasesState === VALUE_STATES.LOADING && (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            )}
            {databasesState === VALUE_STATES.LOADED && isEmpty(databases) && (
              <div>No databases available</div>
            )}
            {databasesState === VALUE_STATES.LOADED && !isEmpty(databases) && (
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
                {Object.keys(databases).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </>
          {/* COLLECTIONS SELECT */}
          <>
            {!databaseName && <div></div>}
            {databaseName && (
              <select
                name={collectionName}
                onChange={(value) => {
                  setState((state) => ({
                    ...state,
                    collectionName: value.target.value,
                  }));
                  setDocumentsTabState(DOCUMENTS_TAB_INITIATE_STATE);
                  setAggregateTabStagesInputState(
                    AGGREGATE_TAB_STAGE_INPUT_INITIAL_STATE
                  );
                  setAggregateTabStagesOutputState(
                    AGGREGATE_TAB_STAGE_OUTPUT_INITIAL_STATE
                  );
                  setSchemaTabState(SCHEMA_TAB_INITIAL_STATE);
                }}
              >
                {!collectionName && <option key={0} value={undefined}></option>}
                {databases[databaseName].collections.map(({ name }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          columnGap: "5px",
        }}
      >
        {/* SERVER INFO BUTTON */}
        <>
          <button
            hidden={status !== VALUE_STATES.LOADED}
            style={{
              display: "flex",
              alignItems: "center",
              height: "30px",
            }}
            onClick={() => setDisplay(DISPLAY_TYPES.INFO)}
          >
            Info
          </button>
        </>
        {/* SERVER METRIC BUTTON */}
        <>
          <button
            hidden={status !== VALUE_STATES.LOADED}
            style={{
              display: "flex",
              alignItems: "center",
              height: "30px",
            }}
            onClick={() => setDisplay(DISPLAY_TYPES.METRIC)}
          >
            Metric
          </button>
        </>
      </div>
    </div>
  );
};
