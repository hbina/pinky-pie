import { cloneDeep } from "lodash";
import { Spinner } from "react-bootstrap";
import ReactJson from "react-json-view";
import { COLOR_THEME } from "../constant";

import { ReactSetState, VALUE_STATES } from "../types";
import {
  AggregateTabStageInput,
  AggregateTabStageOutput,
  AGGREGATE_OPERATIONS,
} from "./AggregateTab";

export type AggregateTabStageRowProps = {
  rowIdx: number;
  height: number;
  inputDisabled: boolean;
  stageInput: AggregateTabStageInput;
  setStagesInput: ReactSetState<AggregateTabStageInput[]>;
  stageOutput: AggregateTabStageOutput;
  setStagesOutput: ReactSetState<AggregateTabStageOutput[]>;
};

export const AggregateTabStageRow = ({
  rowIdx,
  height,
  inputDisabled,
  stageInput,
  setStagesInput,
  stageOutput,
  setStagesOutput,
}: Readonly<AggregateTabStageRowProps>) => {
  const { collapsed, stageBody } = stageInput;
  const { status, documents } = stageOutput;

  return (
    <div
      key={rowIdx}
      style={{
        display: "flex",
        flexDirection: "row",
        columnGap: "10px",
        padding: "5px",
        paddingBottom: "5px",
        overflow: "auto",
        borderStyle: "inset",
        borderColor: "black",
        borderWidth: "1px",
        borderRadius: "5px",
        backgroundColor: COLOR_THEME,
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
                setStagesInput((stages) =>
                  stages.map((s, idx) => ({
                    ...s,
                    collapsed: rowIdx === idx ? !s.collapsed : s.collapsed,
                  }))
                )
              }
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
            <select
              disabled={inputDisabled}
              onChange={(v) =>
                setStagesInput((stages) =>
                  stages.map((s, idx) => ({
                    ...s,
                    stageOperation:
                      rowIdx === idx ? v.target.value : s.stageOperation,
                  }))
                )
              }
            >
              {AGGREGATE_OPERATIONS.map((name, idx) => (
                <option key={idx} value={name}>
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
              disabled={inputDisabled}
              onClick={() => {
                setStagesInput((stages) =>
                  stages.filter((v, idx) => idx !== rowIdx)
                );
                setStagesOutput((stages) =>
                  stages.filter((v, idx) => idx !== rowIdx)
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
              disabled={inputDisabled}
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
                    status: VALUE_STATES.UNLOADED,
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
            disabled={inputDisabled}
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
        {status === VALUE_STATES.UNLOADED && (
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
        {status === VALUE_STATES.LOADING && (
          <Spinner animation="border" role="status" />
        )}
        {status === VALUE_STATES.LOADED && documents.length === 0 && (
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
        {status === VALUE_STATES.LOADED && documents.length !== 0 && collapsed && (
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
        {status === VALUE_STATES.LOADED &&
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
                <div
                  key={colIdx}
                  style={{
                    minWidth: "300px",
                    maxWidth: "300px",
                    padding: "5px",
                    borderStyle: "inset",
                    borderColor: "black",
                    borderWidth: "1px",
                    borderRadius: "5px",
                    backgroundColor: "white",
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
                </div>
              ))}
            </div>
          )}
      </>
    </div>
  );
};
