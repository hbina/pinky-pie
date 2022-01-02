import { DebouncedFunc } from "lodash";
import { Button, Card, Dropdown } from "react-bootstrap";
import ReactJson from "react-json-view";

import {
  AggregateDocumentsInput,
  AggregationStages,
  ReactSetState,
} from "../types";

export const DocumentAggregation = ({
  aggregationData,
  setAggregationData,
  mongodb_aggregate_documents,
}: {
  aggregationData: AggregationStages;
  setAggregationData: ReactSetState<AggregationStages>;
  mongodb_aggregate_documents: DebouncedFunc<() => void>;
}) => (
  <div
    style={{
      display: "flex",
      height: "500px",
      flexDirection: "column",
      rowGap: "10px",
      padding: "5px",
      overflowY: "scroll",
    }}
  >
    <Button onClick={() => mongodb_aggregate_documents()}>Refresh</Button>
    {aggregationData.map(({ stageOperation, stageBody, documents }, rowIdx) => (
      <div
        key={rowIdx}
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
              justifyContent: "right",
              paddingBottom: "5px",
            }}
          >
            <Dropdown>
              <Dropdown.Toggle variant="success" id="dropdown-basic">
                {stageOperation || "$match"}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item
                  eventKey="1"
                  onClick={() =>
                    setAggregationData((stages) => {
                      const copy = [...stages];
                      copy[rowIdx].stageOperation = "$match";
                      return copy;
                    })
                  }
                >
                  $match
                </Dropdown.Item>
                <Dropdown.Item
                  eventKey="2"
                  onClick={() =>
                    setAggregationData((stages) => {
                      const copy = [...stages];
                      copy[rowIdx].stageOperation = "$project";
                      return copy;
                    })
                  }
                >
                  $project
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Button
              onClick={() =>
                setAggregationData((stages) =>
                  stages.filter((v, idx) => idx !== rowIdx)
                )
              }
            >
              Delete
            </Button>
            <Button
              onClick={() =>
                setAggregationData((stages) => {
                  const leftCopy = stages.filter((v, idx) => idx <= rowIdx);
                  const rightCopy = stages.filter((v, idx) => idx > rowIdx);
                  return [
                    ...leftCopy,
                    {
                      stageOperation: "$match",
                      stageBody: "{}",
                      documents: [],
                    },
                    ...rightCopy,
                  ];
                })
              }
            >
              +
            </Button>
          </div>
          <textarea
            style={{
              display: "flex",
            }}
            onChange={(value) =>
              setAggregationData((stages) => {
                const copy = [...stages];
                try {
                  const json = JSON.stringify(JSON.parse(value.target.value));
                  copy[rowIdx].stageBody = json;
                } catch (e) {
                  copy[rowIdx].stageBody = value.target.value;
                }
                return copy;
              })
            }
            value={stageBody}
          />
        </div>
        <div
          key={rowIdx}
          style={{
            display: "flex",
            flexDirection: "row",
            overflowX: "scroll",
            columnGap: "5px",
          }}
        >
          {documents.length === 0 && <div>No documents found</div>}
          {documents.length !== 0 &&
            documents.map((document, colIdx) => (
              <div
                key={colIdx}
                style={{
                  display: "flex",
                }}
              >
                <Card
                  style={{
                    display: "flex",
                  }}
                >
                  <Card.Body>
                    <ReactJson
                      style={{
                        display: "flex",
                      }}
                      src={document}
                      collapsed={1}
                    />
                  </Card.Body>
                </Card>
              </div>
            ))}
        </div>
      </div>
    ))}
    <Button
      onClick={() => {
        setAggregationData((stages) => {
          const copy = [
            ...stages,
            {
              stageOperation: "$match",
              stageBody: "{}",
              documents: [],
            },
          ];
          return copy;
        });
      }}
    >
      Add stage
    </Button>
  </div>
);

export default DocumentAggregation;
