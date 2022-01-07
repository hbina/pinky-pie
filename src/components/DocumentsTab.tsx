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
    functions: { mongodb_find_documents },
    connectionData: { databaseName, collectionName },
    documentsTab: {
      perPage,
      setPerPage,
      page,
      setPage,
      documentsCount,
      loading,
      setLoading,
      documents,
      setDocumentsFilter,
      setDocumentsProjection,
      setDocumentsSort,
      documentsFilter,
      documentsSort,
      documentsProjection,
      jsonDepth,
      setJsonDepth,
      queryButtonStatus,
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
      <Form
        style={{
          display: "flex",
          flexDirection: "row",
          columnGap: "5px",
          justifyContent: "flex-start",
        }}
        noValidate
        validated={validated}
        onSubmit={handleSubmit}
      >
        <Form.Group
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <InputGroup.Text>Page</InputGroup.Text>
              <Form.Control
                required
                type="number"
                disabled={loading}
                onChange={(v) => {
                  setLoading(true);
                  setPage(Math.max(0, parseInt(v.target.value)));
                }}
                value={page}
              />
            </div>
          </div>
        </Form.Group>
        <Form.Group
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <InputGroup.Text>Per page</InputGroup.Text>
              <Form.Control
                required
                type="number"
                disabled={loading}
                onChange={(v) => {
                  setLoading(true);
                  setPerPage(Math.max(0, parseInt(v.target.value)));
                }}
                value={perPage}
              />
            </div>
          </div>
        </Form.Group>
        <Form.Group
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <InputGroup.Text>Depth</InputGroup.Text>
              <Form.Control
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
        <Button
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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div
          style={{
            display: "flex",
            flexGrow: 80,
            flexDirection: "column",
          }}
        >
          <InputGroup>
            <InputGroup.Text>Filter</InputGroup.Text>
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
          </InputGroup>
          <InputGroup>
            <InputGroup.Text>Projection</InputGroup.Text>
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
          </InputGroup>
          <InputGroup>
            <InputGroup.Text>Sort</InputGroup.Text>
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
          </InputGroup>
        </div>
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            flexDirection: "column",
            justifyContent: "flex-start",
            columnGap: "5px",
            padding: "5px",
            alignItems: "center",
          }}
        >
          <Pagination>
            <Pagination.Prev
              onClick={() => {
                setLoading(true);
                setPage((page) => Math.max(0, page - 1));
              }}
            />
            <Pagination.Next
              onClick={() => {
                setLoading(true);
                setPage((page) =>
                  Math.min(Math.floor(documentsCount / perPage), page + 1)
                );
              }}
            />
          </Pagination>
          <p>
            {perPage * page + 1} -
            {Math.min(perPage * (page + 1), documentsCount)} of {documentsCount}
          </p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          rowGap: "5px",
        }}
      >
        {loading ? (
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
