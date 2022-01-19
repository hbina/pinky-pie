import { cloneDeep } from "lodash";
import { Card, Spinner } from "react-bootstrap";
import ReactJson from "react-json-view";

import {
  AggregationStageInput,
  AggregationStageOutput,
  ReactSetState,
  VALUE_STATES,
} from "../types";
import { AGGREGATE_OPERATIONS } from "./AggregateTab";

export type AggregateTabStageRowProps = {
  rowIdx: number;
  height: number;
  stageInput: AggregationStageInput;
  setStagesInput: ReactSetState<AggregationStageInput[]>;
  stageOutput: AggregationStageOutput;
  setStagesOutput: ReactSetState<AggregationStageOutput[]>;
};

export const AggregateTabStageRow = ({
  rowIdx,
  height,
  stageInput,
  setStagesInput,
  stageOutput,
  setStagesOutput,
}: Readonly<AggregateTabStageRowProps>) => {
  const { collapsed, stageBody } = stageInput;
  const { loading, documents } = stageOutput;

  return (
    <Card
      key={rowIdx}
      style={{
        padding: "5px",
        paddingBottom: collapsed ? "5px" : "15px",
        overflowX: "scroll",
        backgroundColor: "#fff5e9",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          columnGap: "10px",
        }}
      >
        {/* Input column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            rowGap: "10px",
            minWidth: "400px",
            maxWidth: "400px",
            padding: "5px",
          }}
        >
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
                columnGap: "1px",
              }}
            >
              <button
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "30px",
                  width: "100px",
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
              </button>
              <select>
                {AGGREGATE_OPERATIONS.map((name, idx) => (
                  <option
                    key={idx}
                    value={name}
                    onClick={() =>
                      setStagesInput((stages) => {
                        const copy = cloneDeep(stages);
                        copy[rowIdx].stageOperation = name;
                        return copy;
                      })
                    }
                  >
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                columnGap: "1px",
              }}
            >
              <button
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "30px",
                }}
                disabled={loading === VALUE_STATES.LOADING}
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
              </button>
              <button
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "30px",
                }}
                disabled={loading === VALUE_STATES.LOADING}
                onClick={() => {
                  setStagesInput((stages) => [
                    ...cloneDeep(stages.filter((v, idx) => idx <= rowIdx)),
                    {
                      collapsed: false,
                      stageOperation: "$match",
                      stageBody: "{}",
                    },
                    ...cloneDeep(stages.filter((v, idx) => idx > rowIdx)),
                  ]);
                  setStagesOutput((stages) => [
                    ...cloneDeep(stages.filter((v, idx) => idx <= rowIdx)),
                    {
                      loading: VALUE_STATES.UNLOADED,
                      documents: [],
                    },
                    ...cloneDeep(stages.filter((v, idx) => idx > rowIdx)),
                  ]);
                }}
              >
                +
              </button>
            </div>
          </div>
          {!collapsed && (
            <textarea
              style={{
                display: "flex",
              }}
              disabled={loading === VALUE_STATES.LOADING}
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
        {/* Output column */}
        <>
          {loading === VALUE_STATES.UNLOADED && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              Please refresh query
            </div>
          )}
          {loading === VALUE_STATES.LOADING && (
            <Spinner animation="border" role="status" />
          )}
          {loading === VALUE_STATES.LOADED && documents.length === 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              No documents found
            </div>
          )}
          {loading === VALUE_STATES.LOADED &&
            documents.length !== 0 &&
            collapsed && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                {documents.length} sample documents
              </div>
            )}
          {loading === VALUE_STATES.LOADED &&
            documents.length !== 0 &&
            !collapsed && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  columnGap: "10px",
                  alignItems: "flex-start",
                }}
              >
                {documents.map((document, colIdx) => (
                  <Card
                    key={colIdx}
                    style={{
                      minWidth: "300px",
                      maxWidth: "300px",
                      padding: "5px",
                    }}
                  >
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
                  </Card>
                ))}
              </div>
            )}
        </>
      </div>
    </Card>
  );
};
