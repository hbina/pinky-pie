import { useState } from "react";
import ReactJson from "react-json-view";
import {
  Card,
  InputGroup,
  Spinner,
  FormControl,
  Pagination,
  Form,
  Button,
  Stack,
} from "react-bootstrap";

import { BsonDocument, CONTAINER_STATUS, AppState } from "../types";

export const useDocumentsTabState = () => {
  const [documents, setDocuments] = useState<BsonDocument[]>([]);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [documentsFilter, setDocumentsFilter] = useState({});
  const [documentsProjection, setDocumentsProjection] = useState({});
  const [documentsSort, setDocumentsSort] = useState({});
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [jsonDepth, setJsonDepth] = useState(1);
  const [queryButtonStatus, setQueryButtonStatus] = useState(
    CONTAINER_STATUS.ENABLED
  );

  return {
    documents,
    setDocuments,
    documentsCount,
    setDocumentsCount,
    loading,
    setLoading,
    documentsFilter,
    setDocumentsFilter,
    documentsProjection,
    setDocumentsProjection,
    documentsSort,
    setDocumentsSort,
    perPage,
    setPerPage,
    page,
    setPage,
    jsonDepth,
    setJsonDepth,
    queryButtonStatus,
    setQueryButtonStatus,
  };
};

export const DocumentsTab = ({
  appStates: {
    window: { width, height },
    functions: { mongodb_find_documents },
    connectionData: { databaseName, collectionName },
    documentsTabState: {
      perPage,
      setPerPage,
      page,
      setPage,
      documentsCount,
      loading,
      documents,
      setDocumentsFilter,
      setDocumentsProjection,
      setDocumentsSort,
      documentsFilter,
      documentsSort,
      documentsProjection,
      jsonDepth,
      setJsonDepth,
    },
  },
}: Readonly<{ appStates: AppState }>) => {
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
              disabled={loading}
              onChange={(v) =>
                v.target.value === ""
                  ? setPage(0)
                  : setPage(Math.max(0, parseInt(v.target.value)))
              }
              value={page === 10 ? 50 : page}
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
              disabled={loading}
              onChange={(v) =>
                v.target.value === ""
                  ? setPerPage(0)
                  : setPerPage(Math.max(0, parseInt(v.target.value)))
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
              disabled={loading}
              onChange={(v) =>
                v.target.value === ""
                  ? setJsonDepth(0)
                  : setJsonDepth(Math.max(0, parseInt(v.target.value)))
              }
              value={jsonDepth}
            />
          </div>
        </div>
        <Button
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "30px",
          }}
          disabled={loading}
          onClick={() =>
            mongodb_find_documents({
              databaseName,
              collectionName,
              page,
              perPage,
              documentsFilter,
              documentsSort,
              documentsProjection,
            })
          }
        >
          Query
        </Button>
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
              placeholder={JSON.stringify({ key: "value" })}
              disabled={loading}
              onChange={(e) => {
                try {
                  const filter = JSON.parse(e.target.value);
                  setDocumentsFilter(filter);
                } catch (e) {
                  setDocumentsFilter({});
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
              placeholder={JSON.stringify({ key: "value" })}
              disabled={loading}
              onChange={(e) => {
                try {
                  const filter = JSON.parse(e.target.value);
                  setDocumentsProjection(filter);
                } catch (e) {
                  setDocumentsProjection({});
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
              placeholder={JSON.stringify({ key: "value" })}
              disabled={loading}
              onChange={(e) => {
                try {
                  const filter = JSON.parse(e.target.value);
                  setDocumentsSort(filter);
                } catch (e) {
                  setDocumentsSort({});
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
              disabled={loading}
              style={{
                display: "flex",
                height: "30px",
              }}
              onClick={() => {
                setPage((page) => Math.max(0, page - 1));
                mongodb_find_documents({
                  databaseName,
                  collectionName,
                  page,
                  perPage,
                  documentsFilter,
                  documentsSort,
                  documentsProjection,
                });
              }}
            />
            <Pagination.Next
              disabled={loading}
              style={{
                display: "flex",
                height: "30px",
              }}
              onClick={() => {
                setPage((page) =>
                  Math.min(Math.floor(documentsCount / perPage), page + 1)
                );
                mongodb_find_documents({
                  databaseName,
                  collectionName,
                  page,
                  perPage,
                  documentsFilter,
                  documentsSort,
                  documentsProjection,
                });
              }}
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
        {loading ? (
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
        ) : (
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
