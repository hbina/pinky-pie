import ReactJson from "react-json-view";

import { BsonDocument } from "../types";
import { Card, Spinner } from "react-bootstrap";

const DocumentListing = ({
  loading,
  documents,
}: Readonly<{
  loading: boolean;
  documents: BsonDocument[];
}>) => (
  <div>
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
