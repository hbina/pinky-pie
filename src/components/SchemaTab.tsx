import { invoke } from "@tauri-apps/api";
import { chain } from "lodash";
import { useState, useEffect } from "react";
import {
  Button,
  Card,
  FormControl,
  InputGroup,
  ProgressBar,
  Spinner,
  Stack,
} from "react-bootstrap";

import { MongodbAnalyzeDocumentOutput, VALUE_STATES } from "../types";
import { AppState } from "../App";

export type SchemaTabProps = {
  loading: VALUE_STATES;
  documentsFilter: Record<string, unknown>;
  documents: MongodbAnalyzeDocumentOutput;
};

export const SCHEMA_TAB_INITIAL_STATE: SchemaTabProps = {
  loading: VALUE_STATES.UNLOADED,
  documentsFilter: {},
  documents: [],
};

export const useSchemaTabState = () => {
  const [state, setState] = useState<SchemaTabProps>(SCHEMA_TAB_INITIAL_STATE);
  return {
    state,
    setState,
  };
};

const PROGRESS_BAR_VARIANT = ["success", "danger", "warning", "info"];

export const SchemaTab = ({
  appStates: {
    connectionData: {
      state: { databaseName, collectionName },
    },
    schemaTabState: {
      state: { loading, documents, documentsFilter },
      setState,
    },
  },
}: Readonly<{
  appStates: AppState;
}>) => {
  const inputDisabled = loading === VALUE_STATES.LOADING;

  useEffect(() => {
    const f = async () => {
      if (loading === VALUE_STATES.UNLOADED && databaseName && collectionName) {
        try {
          setState((state) => ({
            ...state,
            loading: VALUE_STATES.LOADING,
            documents: [],
          }));
          const result = await invoke<MongodbAnalyzeDocumentOutput>(
            "mongodb_analyze_documents",
            {
              databaseName,
              collectionName,
              documentsFilter,
            }
          );
          setState((state) => ({
            ...state,
            loading: VALUE_STATES.LOADED,
            documents: chain(result).sort().value(),
          }));
        } catch (e) {
          console.error(e);
          setState(SCHEMA_TAB_INITIAL_STATE);
        }
      }
    };
    f();
  }, [databaseName, collectionName, loading, documentsFilter, setState]);

  return (
    <Stack
      direction="vertical"
      style={{
        paddingTop: "5px",
        rowGap: "5px",
      }}
    >
      <Stack
        direction="horizontal"
        style={{
          columnGap: "5px",
        }}
      >
        <InputGroup>
          <InputGroup.Text>Filter</InputGroup.Text>
          <FormControl
            placeholder={JSON.stringify({ key: "value" }, null, 2)}
            disabled={inputDisabled}
            onChange={(e) => {
              try {
                const filter = JSON.parse(e.target.value);
                setState((state) => ({
                  ...state,
                  documentsFilter: filter,
                }));
              } catch (e) {
                setState((state) => ({
                  ...state,
                  documentsFilter: {},
                }));
              }
            }}
          />
        </InputGroup>
        <Button
          disabled={inputDisabled}
          onClick={() =>
            setState((state) => ({
              ...state,
              loading: VALUE_STATES.UNLOADED,
            }))
          }
        >
          Analyze
        </Button>
      </Stack>
      <Stack
        direction="vertical"
        style={{
          rowGap: "5px",
        }}
      >
        {loading === VALUE_STATES.LOADING ? (
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              rowGap: "5px",
            }}
          >
            {documents.map(([key, document]) => (
              <div key={key}>
                <Card
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Card.Header>{key}</Card.Header>
                  <Card.Body>
                    <ProgressBar>
                      {document.map(([key, v], idx) => (
                        <ProgressBar
                          now={
                            (v / chain(document).map("1").sum().value()) * 100
                          }
                          variant={
                            PROGRESS_BAR_VARIANT[
                              idx % PROGRESS_BAR_VARIANT.length
                            ]
                          }
                          key={key}
                          label={key}
                        />
                      ))}
                    </ProgressBar>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        )}
      </Stack>
    </Stack>
  );
};
