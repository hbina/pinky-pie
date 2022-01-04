import { cloneDeep, DebouncedFunc } from "lodash";
import { Button, Card, Dropdown } from "react-bootstrap";
import ReactJson from "react-json-view";

import { AggregationStages, ReactSetState } from "../types";
import { useWindowDimensions } from "../util";

export const DocumentAggregation = ({
  aggregationData,
  setAggregationData,
  mongodb_aggregate_documents,
}: {
  aggregationData: AggregationStages;
  setAggregationData: ReactSetState<AggregationStages>;
  mongodb_aggregate_documents: DebouncedFunc<() => void>;
}) => {
  const { height, width } = useWindowDimensions();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        rowGap: "10px",
        paddingTop: "5px",
        // TODO: This is mostly a hack
        minHeight: `${Math.max(0, height - 100)}px`,
      }}
    >
      <Button onClick={() => mongodb_aggregate_documents()}>Refresh</Button>
      {aggregationData.map(
        ({ collapsed, stageOperation, stageBody, documents }, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: "flex",
              flexDirection: "row",
              columnGap: "10px",
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
                  justifyContent: "space-between",
                  paddingBottom: "5px",
                  minWidth: "400px",
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
                    onClick={() =>
                      setAggregationData((stages) => {
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
                    <Dropdown.Toggle variant="success" id="dropdown-basic">
                      {stageOperation || "$match"}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      style={{
                        maxHeight: "500px",
                        overflowY: "auto",
                      }}
                    >
                      {[
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
                      ].map((name) => (
                        <Dropdown.Item
                          eventKey="1"
                          onClick={() =>
                            setAggregationData((stages) => {
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
                        const leftCopy = stages.filter(
                          (v, idx) => idx <= rowIdx
                        );
                        const rightCopy = stages.filter(
                          (v, idx) => idx > rowIdx
                        );
                        return [
                          ...cloneDeep(leftCopy),
                          {
                            collapsed: false,
                            stageOperation: "$match",
                            stageBody: "{}",
                            documents: [],
                          },
                          ...cloneDeep(rightCopy),
                        ];
                      })
                    }
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
                  onChange={(value) =>
                    setAggregationData((stages) => {
                      const copy = cloneDeep(stages);
                      try {
                        const json = JSON.stringify(
                          JSON.parse(value.target.value)
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
            {!collapsed && (
              <div
                key={rowIdx}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  overflowX: "auto",
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
                            name={false}
                            src={document}
                            collapsed={1}
                            iconStyle="square"
                            indentWidth={2}
                            displayObjectSize={false}
                            displayDataTypes={false}
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
        )
      )}
      <Button
        onClick={() => {
          setAggregationData((stages) => {
            const copy = [
              ...cloneDeep(stages),
              {
                collapsed: false,
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
};

export default DocumentAggregation;
