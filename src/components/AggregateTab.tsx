import { useEffect, useState } from "react";
import { Form, InputGroup } from "react-bootstrap";

import { VALUE_STATES } from "../types";
import { AppState } from "../App";
import { mongodb_aggregate_documents } from "../util";
import { AggregateTabStageRow } from "./AggregateTabStageRow";

export const AGGREGATE_OPERATIONS = [
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

export type AggregateTabStageInput = {
  collapsed: boolean;
  stageOperation: string;
  stageBody: string;
};

export const AGGREGATE_TAB_STAGE_INPUT_INITIAL_STATE: AggregateTabStageInput[] =
  [
    {
      collapsed: false,
      stageOperation: AGGREGATE_OPERATIONS[0],
      stageBody: "{}",
    },
  ];

export type AggregateTabInputProps = {
  documentWidth: number;
  sampleCount: number;
};

export const AGGREGATE_TAB_INPUT_INITIAL_STATE: AggregateTabInputProps = {
  documentWidth: 200,
  sampleCount: 2,
};

export type AggregateTabStageOutput = {
  status: VALUE_STATES;
  documents: Record<string, unknown>[];
};

export const AGGREGATE_TAB_STAGE_OUTPUT_INITIAL_STATE: AggregateTabStageOutput[] =
  [
    {
      status: VALUE_STATES.UNLOADED,
      documents: [],
    },
  ];

export const useAggregateTabState = () => {
  const [input, setInput] = useState<AggregateTabInputProps>(
    AGGREGATE_TAB_INPUT_INITIAL_STATE
  );

  const [stagesInput, setStagesInput] = useState<AggregateTabStageInput[]>(
    AGGREGATE_TAB_STAGE_INPUT_INITIAL_STATE
  );

  const [stagesOutput, setStagesOutput] = useState<AggregateTabStageOutput[]>(
    AGGREGATE_TAB_STAGE_OUTPUT_INITIAL_STATE
  );

  return {
    input,
    setInput,
    stagesInput,
    setStagesInput,
    stagesOutput,
    setStagesOutput,
  };
};

export const AggregateTab = ({
  appStates,
}: Readonly<{
  appStates: AppState;
}>) => {
  const {
    window: { height },
    connectionData: {
      state: { status: connectionStatus, databaseName, collectionName },
    },
    aggregateTabState: {
      input: { sampleCount },
      setInput,
      stagesInput,
      setStagesInput,
      stagesOutput,
      setStagesOutput,
    },
  } = appStates;

  const inputDisabled = stagesOutput.some(
    (s) => s.status === VALUE_STATES.LOADING
  );

  useEffect(() => {
    const f = async () => {
      if (
        connectionStatus === VALUE_STATES.LOADED &&
        databaseName &&
        collectionName &&
        stagesOutput.some((s) => s.status === VALUE_STATES.UNLOADED)
      ) {
        try {
          const shouldReloadIndices = stagesOutput
            .map(({ status: loading }, idx) => ({
              idx,
              loading,
            }))
            .filter((s) => s.loading === VALUE_STATES.UNLOADED);
          setStagesOutput((state) =>
            state.map((s) => {
              const shouldReload = s.status === VALUE_STATES.UNLOADED;
              return {
                ...s,
                status: shouldReload ? VALUE_STATES.LOADING : s.status,
                documents: shouldReload ? [] : s.documents,
              };
            })
          );
          if (sampleCount > 0) {
            shouldReloadIndices.forEach(async ({ idx }) => {
              const documents = await mongodb_aggregate_documents({
                databaseName,
                collectionName,
                idx,
                sampleCount,
                stages: stagesInput,
              });
              setStagesOutput((state) =>
                state.map((s, idx2) =>
                  idx === idx2
                    ? {
                        ...s,
                        status: VALUE_STATES.LOADED,
                        documents,
                      }
                    : s
                )
              );
            });
          } else {
            setStagesOutput((state) =>
              state.map((s) => ({
                ...s,
                status: VALUE_STATES.LOADED,
                documents: [],
              }))
            );
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    f();
  }, [
    collectionName,
    databaseName,
    sampleCount,
    stagesInput,
    connectionStatus,
    stagesOutput,
    inputDisabled,
    setStagesOutput,
  ]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* inputs */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          paddingTop: "5px",
          paddingBottom: "5px",
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
          <InputGroup.Text
            style={{
              height: "30px",
            }}
          >
            Sample count
          </InputGroup.Text>
          <Form.Control
            style={{
              width: "100px",
              height: "30px",
            }}
            required
            type="number"
            disabled={inputDisabled}
            onChange={(v) =>
              setInput((state) => ({
                ...state,
                sampleCount: Math.max(0, parseInt(v.target.value)),
              }))
            }
            value={sampleCount}
          />
        </div>
        <button
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "30px",
          }}
          disabled={inputDisabled}
          onClick={() =>
            setStagesOutput((state) =>
              state.map((s) => ({
                ...s,
                status: VALUE_STATES.UNLOADED,
              }))
            )
          }
        >
          Refresh
        </button>
      </div>
      {/* stages */}
      <>
        {stagesInput.length === 0 && (
          <button
            onClick={() => {
              setStagesInput([
                {
                  collapsed: false,
                  stageOperation: AGGREGATE_OPERATIONS[0],
                  stageBody: "{}",
                },
              ]);
              setStagesOutput([
                {
                  status: VALUE_STATES.UNLOADED,
                  documents: [],
                },
              ]);
            }}
          >
            Add stage
          </button>
        )}
        {stagesInput.length !== 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              rowGap: "5px",
            }}
          >
            {stagesInput
              .map((l, i) => ({
                stageInput: l,
                stageOutput: stagesOutput[i],
              }))
              .map(({ stageInput, stageOutput }, rowIdx) => (
                <div key={rowIdx}>
                  <AggregateTabStageRow
                    rowIdx={rowIdx}
                    height={height}
                    inputDisabled={inputDisabled}
                    stageInput={stageInput}
                    setStagesInput={setStagesInput}
                    stageOutput={stageOutput}
                    setStagesOutput={setStagesOutput}
                  />
                </div>
              ))}
          </div>
        )}
      </>
    </div>
  );
};
