import { cloneDeep, chain } from "lodash";
import { useState } from "react";
import { Form, InputGroup, Stack } from "react-bootstrap";

import {
  AggregationStageInput,
  AggregationStageOutput,
  AppState,
  CONTAINER_STATES,
} from "../types";
import { mongodb_aggregate_documents } from "../util";
import { AggregateTabStageRow } from "./AggregateTabStageRow";
import { EitherView } from "./EitherView";

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
      loading: CONTAINER_STATES.UNLOADED,
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
    window: { height },
    connectionData: {
      state: { databaseName, collectionName },
    },
    aggregateTabState: {
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
  return (
    <Stack direction="vertical">
      {/* inputs */}
      <Stack
        direction="horizontal"
        style={{
          padding: "5px",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="horizontal">
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
              .some((s) => s.loading === CONTAINER_STATES.LOADING)
              .value()}
            onChange={(v) =>
              setSampleCount(Math.max(0, parseInt(v.target.value)))
            }
            value={sampleCount}
          />
        </Stack>
        <button
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "30px",
          }}
          disabled={chain(stagesOutput)
            .some((s) => s.loading === CONTAINER_STATES.LOADING)
            .value()}
          onClick={() => {
            stagesInput
              .map((_a, idx) => stagesInput.filter((_b, idx2) => idx2 <= idx))
              .forEach(
                (stages, idx) =>
                  databaseName &&
                  collectionName &&
                  mongodb_aggregate_documents(
                    {
                      idx,
                      sampleCount,
                      databaseName,
                      collectionName,
                      stages,
                    },
                    setStagesOutput
                  )
              );
          }}
        >
          Refresh
        </button>
      </Stack>
      {/* stages */}
      <EitherView
        predicate={() => stagesInput.length === 0}
        left={
          // If stages are empty
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
                    loading: CONTAINER_STATES.UNLOADED,
                    documents: [],
                  },
                ];
                return copy;
              });
            }}
          >
            Add stage
          </button>
        }
        right={
          <Stack
            direction="vertical"
            style={{
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
          </Stack>
        }
      />
    </Stack>
  );
};
