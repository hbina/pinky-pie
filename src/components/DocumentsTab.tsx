import { useState, useEffect } from "react";
import ReactJson from "react-json-view";
import {
  Card,
  InputGroup,
  Spinner,
  FormControl,
  Pagination,
  Form,
  Stack,
} from "react-bootstrap";

import {
  BsonDocument,
  CONTAINER_STATUS,
  AppState,
  CONTAINER_STATES,
} from "../types";
import { invoke } from "@tauri-apps/api";

export type DocumentsTabProps = {
  documents: BsonDocument[];
  documentsCount: number;
  loading: CONTAINER_STATES;
  documentsFilter: Record<string, unknown>;
  documentsProjection: Record<string, unknown>;
  documentsSort: Record<string, unknown>;
  perPage: number;
  page: number;
  jsonDepth: number;
  queryButtonStatus: CONTAINER_STATUS;
};

export const DOCUMENTS_TAB_INITIATE_STATE: DocumentsTabProps = {
  documents: [],
  documentsCount: 0,
  loading: CONTAINER_STATES.UNLOADED,
  documentsFilter: {},
  documentsProjection: {},
  documentsSort: {},
  perPage: 5,
  page: 0,
  jsonDepth: 1,
  queryButtonStatus: CONTAINER_STATUS.ENABLED,
};

export const useDocumentsTabState = () => {
  const [state, setState] = useState<DocumentsTabProps>(
    DOCUMENTS_TAB_INITIATE_STATE
  );

  return {
    state,
    setState,
  };
};

export const DocumentsTab = ({
  appStates: {
    window: { height },
    connectionData: {
      state: { connectionState, databaseName, collectionName },
    },
    documentsTabState: {
      state: {
        perPage,
        page,
        documentsCount,
        loading,
        documents,
        documentsFilter,
        documentsSort,
        documentsProjection,
        jsonDepth,
      },
      setState,
    },
  },
}: Readonly<{ appStates: AppState }>) => {
  const inputDisabled = loading === CONTAINER_STATES.LOADING;

  useEffect(() => {
    const f = async () => {
      if (loading === CONTAINER_STATES.UNLOADED) {
        try {
          setState((state) => ({
            ...state,
            queryButtonStatus: CONTAINER_STATUS.DISABLED,
            loading: CONTAINER_STATES.LOADING,
            documents: [],
            documentsCount: 0,
          }));
          // NOTE: This 2 promises should be split up
          const documents = await invoke<BsonDocument[]>(
            "mongodb_find_documents",
            {
              databaseName,
              collectionName,
              page,
              perPage,
              documentsFilter,
              documentsProjection,
              documentsSort,
            }
          );
          const documentsCount = await invoke<number>(
            "mongodb_count_documents",
            {
              databaseName,
              collectionName,
              documentsFilter,
            }
          );
          setState((state) => ({
            ...state,
            queryButtonStatus: CONTAINER_STATUS.ENABLED,
            loading: CONTAINER_STATES.LOADED,
            documents,
            documentsCount,
          }));
        } catch (error) {
          console.error(error);
          setState(DOCUMENTS_TAB_INITIATE_STATE);
        }
      }
    };
    f();
  }, [
    connectionState,
    databaseName,
    collectionName,
    documentsFilter,
    documentsProjection,
    documentsSort,
    page,
    perPage,
    loading,
    setState,
  ]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        paddingTop: "5px",
        rowGap: "5px",
      }}
    >
      {/* Document page, perPage and depth */}
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
            columnGap: "5px",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            <InputGroup.Text
              style={{
                height: "30px",
              }}
            >
              Page
            </InputGroup.Text>
            <Form.Control
              style={{
                width: "100px",
                height: "30px",
              }}
              required
              type="number"
              disabled={inputDisabled}
              onChange={(v) =>
                v.target.value === ""
                  ? setState((state) => ({
                      ...state,
                      page: 0,
                    }))
                  : setState((state) => ({
                      ...state,
                      page: Math.max(0, parseInt(v.target.value)),
                    }))
              }
              value={page}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              height: "30px",
            }}
          >
            <InputGroup.Text
              style={{
                height: "30px",
              }}
            >
              Per page
            </InputGroup.Text>
            <Form.Control
              style={{
                width: "100px",
                height: "30px",
              }}
              required
              type="number"
              disabled={inputDisabled}
              onChange={(v) =>
                v.target.value === ""
                  ? setState((state) => ({
                      ...state,
                      perPage: 0,
                    }))
                  : setState((state) => ({
                      ...state,
                      perPage: Math.max(0, parseInt(v.target.value)),
                    }))
              }
              value={perPage}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              height: "30px",
            }}
          >
            <InputGroup.Text
              style={{
                height: "30px",
              }}
            >
              Depth
            </InputGroup.Text>
            <Form.Control
              style={{
                width: "100px",
                height: "30px",
              }}
              required
              type="number"
              disabled={inputDisabled}
              onChange={(v) =>
                v.target.value === ""
                  ? setState((state) => ({
                      ...state,
                      jsonDepth: 0,
                    }))
                  : setState((state) => ({
                      ...state,
                      jsonDepth: Math.max(0, parseInt(v.target.value)),
                    }))
              }
              value={jsonDepth}
            />
          </div>
        </div>
        <button
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "30px",
          }}
          disabled={inputDisabled}
          onClick={() =>
            setState((state) => ({
              ...state,
              loading: CONTAINER_STATES.UNLOADED,
            }))
          }
        >
          Query
        </button>
      </div>
      {/*
      1. Document filters, projections and sort
      2. Pagination on the right.
      */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          columnGap: "5px",
        }}
      >
        <Stack direction="vertical">
          <Stack direction="horizontal">
            <InputGroup.Text
              style={{
                width: "120px",
                height: "30px",
              }}
            >
              Filter
            </InputGroup.Text>
            <FormControl
              style={{
                height: "30px",
              }}
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
          </Stack>
          <Stack direction="horizontal">
            <InputGroup.Text
              style={{
                width: "120px",
                height: "30px",
              }}
            >
              Projection
            </InputGroup.Text>
            <FormControl
              style={{
                height: "30px",
              }}
              placeholder={JSON.stringify({ key: "value" }, null, 2)}
              disabled={inputDisabled}
              onChange={(e) => {
                try {
                  const filter = JSON.parse(e.target.value);
                  setState((state) => ({
                    ...state,
                    documentsProjection: filter,
                  }));
                } catch (e) {
                  setState((state) => ({
                    ...state,
                    documentsProjection: {},
                  }));
                }
              }}
            />
          </Stack>
          <Stack direction="horizontal">
            <InputGroup.Text
              style={{
                width: "120px",
                height: "30px",
              }}
            >
              Sort
            </InputGroup.Text>
            <FormControl
              style={{
                height: "30px",
              }}
              placeholder={JSON.stringify({ key: "value" }, null, 2)}
              disabled={inputDisabled}
              onChange={(e) => {
                try {
                  const filter = JSON.parse(e.target.value);
                  setState((state) => ({
                    ...state,
                    documentsSort: filter,
                  }));
                } catch (e) {
                  setState((state) => ({
                    ...state,
                    documentsSort: {},
                  }));
                }
              }}
            />
          </Stack>
        </Stack>
        <Form.Group
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Pagination
            style={{
              display: "flex",
            }}
          >
            <Pagination.Prev
              disabled={inputDisabled}
              style={{
                display: "flex",
                height: "30px",
              }}
              onClick={() =>
                setState((state) => ({
                  ...state,
                  page: Math.max(0, state.page - 1),
                }))
              }
            />
            <Pagination.Next
              disabled={inputDisabled}
              style={{
                display: "flex",
                height: "30px",
              }}
              onClick={() =>
                setState((state) => ({
                  ...state,
                  page: Math.min(
                    Math.floor(documentsCount / perPage),
                    page + 1
                  ),
                }))
              }
            />
          </Pagination>
        </Form.Group>
      </div>
      {/* List of documents */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          rowGap: "5px",
          minHeight: `80%`,
          overflow: "auto",
        }}
      >
        {loading === CONTAINER_STATES.UNLOADED && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "stretch",
            }}
          >
            Please run the query
          </div>
        )}
        {loading === CONTAINER_STATES.LOADING && (
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "center",
              alignItems: "stretch",
              height: `${height * 0.6}px`,
            }}
          >
            <Spinner animation="border" role="status" />
          </div>
        )}
        {loading === CONTAINER_STATES.LOADING && (
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              height: `${height * 0.6}px`,
            }}
          >
            <Spinner animation="border" role="status" />
          </div>
        )}
        {loading === CONTAINER_STATES.LOADED && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              rowGap: "5px",
              height: `${
                height -
                // the URL bar at the top
                (5 + 30 + 5) -
                // tabs
                50 -
                // page and perpage
                (5 + 30 + 5) -
                // document filters, projections and sorts
                (30 * 3 + 5)
              }px`,
            }}
          >
            {documents.map((document, idx) => (
              <div key={idx}>
                <Card>
                  <Card.Body>
                    <ReactJson
                      name={false}
                      src={document}
                      collapsed={jsonDepth}
                      iconStyle="square"
                      indentWidth={2}
                      enableClipboard={false}
                      sortKeys={true}
                    />
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
