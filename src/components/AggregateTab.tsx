import { cloneDeep, chain } from "lodash";
import { useState } from "react";
import {
  Button,
  Card,
  Dropdown,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import ReactJson from "react-json-view";

import {
  AggregationStageInput,
  AggregationStageOutput,
  AppState,
} from "../types";

const AGGREGATE_OPERATIONS = [
  "$addFields",
  "$bucket",
  "$bucketAuto",
  "$collStats",
  "$count",
  "$documents",
  "$facet",
  "$geoNear",
  "$graphLookup",
  "$group",
  "$indexStats",
  "$limit",
  "$lookup",
  "$match",
  "$merge",
  "$out",
  "$project",
  "$redact",
  "$replaceWidth",
  "$replaceRoot",
  "$sample",
  "$search",
  "$searchMeta",
  "$set",
  "$skip",
  "$sort",
  "$sortByCount",
  "$unionWidth",
  "$unset",
  "$unwind",
];

export const useAggregateTabState = () => {
  const [documentWidth, setDocumentWidth] = useState(200);
  const [sampleCount, setSampleCount] = useState(2);
  const [stagesInput, setStagesInput] = useState<AggregationStageInput[]>([
    {
      collapsed: false,
      stageOperation: "$match",
      stageBody: "{}",
    },
  ]);
  const [stagesOutput, setStagesOutput] = useState<AggregationStageOutput[]>([
    {
      loading: false,
      documents: [],
    },
  ]);

  return {
    documentWidth,
    setDocumentWidth,
    sampleCount,
    setSampleCount,
    stagesInput,
    setStagesInput,
    stagesOutput,
    setStagesOutput,
  };
};

export const AggregateTab = ({
  appStates: {
    window: { width, height },
    functions: { mongodb_aggregate_documents },
    connectionData,
    aggregateTabState: {
      documentWidth,
      setDocumentWidth,
      stagesInput,
      setStagesInput,
      stagesOutput,
      setStagesOutput,
      sampleCount,
      setSampleCount,
    },
  },
}: Readonly<{
  appStates: AppState;
}>) => {
  const HEIGHT = "30px";
  const [validated, setValidated] = useState(false);

  const handleSubmit = (event: {
    currentTarget: any;
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }

    setValidated(true);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        rowGap: "5px",
        paddingTop: "5px",
      }}
    >
      <Form
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          height: HEIGHT,
        }}
        noValidate
        validated={validated}
        onSubmit={handleSubmit}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px",
            height: HEIGHT,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              height: HEIGHT,
            }}
          >
            <InputGroup.Text>Sample count</InputGroup.Text>
            <Form.Control
              required
              type="number"
              disabled={chain(stagesOutput)
                .some((s) => s.loading)
                .value()}
              onChange={(v) =>
                setSampleCount(Math.max(0, parseInt(v.target.value)))
              }
              value={sampleCount}
            />
          </div>
          <Button
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: HEIGHT,
            }}
            disabled={chain(stagesOutput)
              .some((s) => s.loading)
              .value()}
            onClick={() => {
              stagesInput
                .map((_a, idx) => stagesInput.filter((_b, idx2) => idx2 <= idx))
                .forEach((stages, idx) =>
                  mongodb_aggregate_documents({
                    idx,
                    sampleCount,
                    databaseName: connectionData.databaseName,
                    collectionName: connectionData.collectionName,
                    stages,
                  })
                );
            }}
          >
            Refresh
          </Button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            columnGap: "5px",
            height: HEIGHT,
          }}
        >
          <InputGroup.Text
            style={{
              height: HEIGHT,
            }}
          >
            Width
          </InputGroup.Text>
          <Form.Range
            style={{
              height: HEIGHT,
            }}
            onChange={(v) =>
              setDocumentWidth(200 + (parseInt(v.target.value) / 100) * width)
            }
          />
        </div>
      </Form>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          rowGap: "5px",
          height: `${
            height - (5 + 30 + 5) - 50 - (5 + 30 + 5) - (5 + 30 + 5)
          }px`,
          overflowY: "scroll",
        }}
      >
        {stagesInput
          .map((l, i) => ({ ...l, ...stagesOutput[i] }))
          .map(
            (
              { collapsed, stageOperation, stageBody, documents, loading },
              rowIdx
            ) => (
              <Card
                key={rowIdx}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  columnGap: "10px",
                  padding: "5px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: `${width / 3}px`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingBottom: "5px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        columnGap: "1px",
                      }}
                    >
                      <Button
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: HEIGHT,
                        }}
                        onClick={() =>
                          setStagesInput((stages) => {
                            const copy = cloneDeep(stages);
                            copy[rowIdx].collapsed = copy[rowIdx].collapsed
                              ? false
                              : true;
                            return copy;
                          })
                        }
                      >
                        {collapsed ? "Expand" : "Collapse"}
                      </Button>
                      <Dropdown>
                        <Dropdown.Toggle
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: HEIGHT,
                          }}
                          id="dropdown-basic"
                        >
                          {stageOperation || "$match"}
                        </Dropdown.Toggle>
                        <Dropdown.Menu
                          style={{
                            height: `${height}px`,
                            overflowY: "auto",
                          }}
                        >
                          {AGGREGATE_OPERATIONS.map((name, idx) => (
                            <Dropdown.Item
                              key={idx}
                              eventKey={idx}
                              onClick={() =>
                                setStagesInput((stages) => {
                                  const copy = cloneDeep(stages);
                                  copy[rowIdx].stageOperation = name;
                                  return copy;
                                })
                              }
                            >
                              {name}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        columnGap: "1px",
                      }}
                    >
                      <Button
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: HEIGHT,
                        }}
                        disabled={loading}
                        onClick={() => {
                          setStagesInput((stages) =>
                            cloneDeep(stages.filter((v, idx) => idx !== rowIdx))
                          );
                          setStagesOutput((stages) =>
                            cloneDeep(stages.filter((v, idx) => idx !== rowIdx))
                          );
                        }}
                      >
                        Delete
                      </Button>
                      <Button
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: HEIGHT,
                        }}
                        disabled={loading}
                        onClick={() => {
                          setStagesInput((stages) => [
                            ...cloneDeep(
                              stages.filter((v, idx) => idx <= rowIdx)
                            ),
                            {
                              collapsed: false,
                              stageOperation: "$match",
                              stageBody: "{}",
                            },
                            ...cloneDeep(
                              stages.filter((v, idx) => idx > rowIdx)
                            ),
                          ]);
                          setStagesOutput((stages) => [
                            ...cloneDeep(
                              stages.filter((v, idx) => idx <= rowIdx)
                            ),
                            {
                              loading: false,
                              documents: [],
                            },
                            ...cloneDeep(
                              stages.filter((v, idx) => idx > rowIdx)
                            ),
                          ]);
                        }}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  {!collapsed && (
                    <textarea
                      style={{
                        display: "flex",
                      }}
                      disabled={loading}
                      onChange={(value) =>
                        setStagesInput((stages) => {
                          const copy = cloneDeep(stages);
                          try {
                            const json = JSON.stringify(
                              JSON.parse(value.target.value),
                              null,
                              2
                            );
                            copy[rowIdx].stageBody = json;
                          } catch (e) {
                            copy[rowIdx].stageBody = value.target.value;
                          }
                          return copy;
                        })
                      }
                      value={stageBody}
                    />
                  )}
                </div>
                {loading && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: `${(width * 2) / 3}px`,
                    }}
                  >
                    <Spinner animation="border" role="status" />
                  </div>
                )}
                {!loading && documents.length === 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: `${(width * 2) / 3}px`,
                    }}
                  >
                    No documents found
                  </div>
                )}
                {!loading && documents.length !== 0 && !collapsed && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      columnGap: "5px",
                    }}
                  >
                    {documents.map((document, colIdx) => (
                      <Card
                        key={colIdx}
                        style={{
                          display: "flex",
                          width: `${documentWidth}px`,
                        }}
                      >
                        <Card.Body>
                          <ReactJson
                            name={false}
                            src={document}
                            collapsed={1}
                            iconStyle="square"
                            indentWidth={2}
                            displayObjectSize={false}
                            displayDataTypes={true}
                            enableClipboard={false}
                            sortKeys={true}
                            onSelect={(v) => console.log("v", v)}
                          />
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            )
          )}
      </div>
      <Button
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "30px",
        }}
        onClick={() => {
          setStagesInput((stages) => {
            const copy = [
              ...cloneDeep(stages),
              {
                collapsed: false,
                stageOperation: "$match",
                stageBody: "{}",
              },
            ];
            return copy;
          });
          setStagesOutput((stages) => {
            const copy = [
              ...cloneDeep(stages),
              {
                loading: false,
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
};
