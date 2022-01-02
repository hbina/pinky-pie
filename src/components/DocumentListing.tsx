import ReactJson from "react-json-view";
import {
  Card,
  InputGroup,
  Spinner,
  FormControl,
  Pagination,
} from "react-bootstrap";

import { BsonDocument, ReactSetState } from "../types";

const DocumentListing = ({
  databaseName,
  collectionName,
  perPage,
  page,
  setPage,
  documentsCount,
  loading,
  setLoading,
  documents,
  setDocumentsFilter,
  setDocumentsProjection,
  setDocumentsSort,
}: Readonly<{
  databaseName: string;
  collectionName: string;
  perPage: number;
  page: number;
  setPage: ReactSetState<number>;
  documentsCount: number;
  loading: boolean;
  setLoading: ReactSetState<boolean>;
  documents: BsonDocument[];
  setDocumentsFilter: ReactSetState<Record<string, unknown>>;
  setDocumentsProjection: ReactSetState<Record<string, unknown>>;
  setDocumentsSort: ReactSetState<Record<string, unknown>>;
}>) => {
  const hidePaginationInfo = databaseName && collectionName ? false : true;
  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div
          style={{
            display: "flex",
            flexGrow: 90,
            flexDirection: "column",
          }}
        >
          <InputGroup>
            <InputGroup.Text>Filter</InputGroup.Text>
            <FormControl
              placeholder={JSON.stringify({ key: "value" })}
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
          hidden={hidePaginationInfo}
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
      {loading && (
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      )}
      {!loading &&
        documents.map((document, idx) => (
          <div key={idx}>
            <Card>
              <Card.Body>
                <ReactJson src={document} collapsed={1} />
              </Card.Body>
            </Card>
          </div>
        ))}
    </div>
  );
};

export default DocumentListing;
