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

import { AppState } from "../App";
import { BsonDocument, CONTAINER_STATUS } from "../types";

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
  const [validated, setValidated] = useState(false);

  const handleSubmit = (event: {
    currentTarget: any;
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      // event.preventDefault();
      // event.stopPropagation();
    }

    setValidated(true);
  };

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
      <Form
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          height: "30px",
        }}
        noValidate
        validated={validated}
        onSubmit={handleSubmit}
      >
        <Stack
          style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px",
            justifyContent: "flex-start",
            height: "30px",
          }}
        >
          <Form.Group
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              height: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "30px",
              }}
            >
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
                  Page
                </InputGroup.Text>
                <Form.Control
                  style={{
                    height: "30px",
                  }}
                  required
                  type="number"
                  disabled={loading}
                  onChange={(v) =>
                    setPage(Math.max(0, parseInt(v.target.value)))
                  }
                  value={page}
                />
              </div>
            </div>
          </Form.Group>
          <Form.Group
            style={{
              display: "flex",
              flexDirection: "row",
              height: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "30px",
              }}
            >
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
                    height: "30px",
                  }}
                  required
                  type="number"
                  disabled={loading}
                  onChange={(v) =>
                    setPerPage(Math.max(0, parseInt(v.target.value)))
                  }
                  value={perPage}
                />
              </div>
            </div>
          </Form.Group>
          <Form.Group
            style={{
              display: "flex",
              flexDirection: "row",
              height: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "30px",
              }}
            >
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
                    height: "30px",
                  }}
                  required
                  type="number"
                  disabled={loading}
                  onChange={(v) =>
                    setJsonDepth(Math.max(0, parseInt(v.target.value)))
                  }
                  value={jsonDepth}
                />
              </div>
            </div>
          </Form.Group>
        </Stack>
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
      </Form>
      {/*
      1. Document filters, projections and sort
      2. Pagination on the right.
      */}
      <Form
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          height: "90px",
          overflow: "auto",
        }}
      >
        <Stack direction="vertical">
          <Form.Group
            style={{
              display: "flex",
              flexDirection: "row",
              height: "30px",
            }}
          >
            <InputGroup.Text
              style={{
                width: "120px",
              }}
            >
              Filter
            </InputGroup.Text>
            <FormControl
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
          </Form.Group>
          <Form.Group
            style={{
              display: "flex",
              flexDirection: "row",
              height: "30px",
            }}
          >
            <InputGroup.Text
              style={{
                width: "120px",
              }}
            >
              Projection
            </InputGroup.Text>
            <FormControl
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
          </Form.Group>
          <Form.Group
            style={{
              display: "flex",
              flexDirection: "row",
              height: "30px",
            }}
          >
            <InputGroup.Text
              style={{
                width: "120px",
              }}
            >
              Sort
            </InputGroup.Text>
            <FormControl
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
          </Form.Group>
        </Stack>
        <Form.Group
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            columnGap: "5px",
            padding: "5px",
            width: "15%",
          }}
        >
          <Pagination
            style={{
              display: "flex",
              height: "30px",
            }}
          >
            <Pagination.Prev
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
          <p
            style={{
              display: "flex",
            }}
          >
            {perPage * page + 1} -
            {Math.min(perPage * (page + 1), documentsCount)} of {documentsCount}
          </p>
        </Form.Group>
      </Form>
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
