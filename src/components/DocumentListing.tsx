import ReactJson from "react-json-view";

import { BsonDocument, ReactSetState } from "../types";
import { Card, InputGroup, Spinner, FormControl } from "react-bootstrap";

const DocumentListing = ({
  loading,
  documents,
  setDocumentsFilter,
  setDocumentsProjection,
  setDocumentsSort,
}: Readonly<{
  loading: boolean;
  documents: BsonDocument[];
  setDocumentsFilter: ReactSetState<Record<string, unknown>>;
  setDocumentsProjection: ReactSetState<Record<string, unknown>>;
  setDocumentsSort: ReactSetState<Record<string, unknown>>;
}>) => (
  <div>
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

export default DocumentListing;
