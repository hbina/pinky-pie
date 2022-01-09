import { chain } from "lodash";
import { useState } from "react";
import {
  Button,
  Card,
  FormControl,
  InputGroup,
  ProgressBar,
  Spinner,
} from "react-bootstrap";

import { AppState } from "../App";
import { MongodbAnalyzeDocumentOutput } from "../types";

export const useSchemaTabState = () => {
  const [loading, setLoading] = useState(false);
  const [documentsFilter, setDocumentsFilter] = useState({});
  const [documents, setDocuments] = useState<MongodbAnalyzeDocumentOutput>([]);

  return {
    loading,
    setLoading,
    documents,
    setDocuments,
    documentsFilter,
    setDocumentsFilter,
  };
};

const PROGRESS_BAR_VARIANT = ["success", "danger", "warning", "info"];

export const SchemaTab = ({
  appStates: {
    functions: { mongodb_analyze_documents },
    connectionData: { databaseName, collectionName },
    schemaTabState: {
      loading,
      setLoading,
      documents,
      setDocuments,
      documentsFilter,
      setDocumentsFilter,
    },
  },
}: Readonly<{
  appStates: AppState;
}>) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        paddingTop: "5px",
        rowGap: "5px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          columnGap: "5px",
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
        <Button
          disabled={loading}
          onClick={() =>
            mongodb_analyze_documents({
              databaseName,
              collectionName,
              documentsFilter,
            })
          }
        >
          Analyze
        </Button>
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
      </div>
    </div>
  );
};
