import { cloneDeep, chain } from "lodash";
import { useEffect, useState } from "react";
import { Form, InputGroup } from "react-bootstrap";

import {
  AggregationStageInput,
  AggregationStageOutput,
  VALUE_STATES,
} from "../types";
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
      loading: VALUE_STATES.UNLOADED,
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
      stagesInput,
      setStagesInput,
      stagesOutput,
      setStagesOutput,
      sampleCount,
      setSampleCount,
    },
  } = appStates;

  useEffect(() => {
    const f = async () => {
      if (
        connectionStatus === VALUE_STATES.LOADED &&
        databaseName &&
        collectionName &&
        stagesOutput.some((s) => s.loading === VALUE_STATES.UNLOADED)
      ) {
        try {
          const shouldReloadIndices = stagesOutput
            .map(({ loading }, idx) => ({
              idx,
              loading,
            }))
            .filter((s) => s.loading === VALUE_STATES.UNLOADED);
          setStagesOutput((state) =>
            state.map((s) => {
              const shouldReload = s.loading === VALUE_STATES.UNLOADED;
              return {
                ...s,
                loading: shouldReload ? VALUE_STATES.LOADING : s.loading,
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
                        loading: VALUE_STATES.LOADED,
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
                loading: VALUE_STATES.LOADED,
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
          padding: "5px",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
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
            disabled={chain(stagesOutput)
              .some((s) => s.loading === VALUE_STATES.LOADING)
              .value()}
            onChange={(v) =>
              setSampleCount(Math.max(0, parseInt(v.target.value)))
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
          disabled={chain(stagesOutput)
            .some((s) => s.loading === VALUE_STATES.LOADING)
            .value()}
          onClick={() =>
            stagesInput.forEach(
              (a, idx) =>
                databaseName &&
                collectionName &&
                mongodb_aggregate_documents({
                  databaseName,
                  collectionName,
                  idx,
                  sampleCount,
                  stages: stagesInput.filter((a, idx2) => idx2 <= idx),
                })
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
                    loading: VALUE_STATES.UNLOADED,
                    documents: [],
                  },
                ];
                return copy;
              });
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
              overflowY: "auto",
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
