import { useEffect, useMemo, useState } from "react";
import { Card } from "react-bootstrap";
import { AxisOptions, Chart } from "react-charts";

import { DISPLAY_TYPES, VALUE_STATES } from "../types";
import { AppState } from "../App";
import { mongodb_get_commands_statistics_per_sec } from "../util";

export type ServerMetricProps = {
  cmds_per_sec: [number, number, number][];
};

export const SERVER_INFO_INITIAL_STATE: ServerMetricProps = {
  cmds_per_sec: Array.from({ length: 20 }, () => [0, 0, 0]),
};

export const useServerMetricState = () => {
  const [state, setState] = useState<ServerMetricProps>(
    SERVER_INFO_INITIAL_STATE
  );

  return {
    state,
    setState,
  };
};

export const ServerMetric = ({
  appStates: {
    connectionData: {
      state: { url, port, status: connectionState },
    },
    serverMetricState: {
      state: { cmds_per_sec },
      setState,
    },
    display,
    setDisplay,
  },
}: Readonly<{ appStates: AppState }>) => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      const f = async () => {
        try {
          if (
            display === DISPLAY_TYPES.METRIC &&
            connectionState === VALUE_STATES.LOADED
          ) {
            const result = await mongodb_get_commands_statistics_per_sec({
              count: 100,
            });
            setState((state) => ({
              ...state,
              cmds_per_sec: result,
            }));
          }
        } catch (e) {
          console.error(e);
        }
      };
      f();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [port, url, connectionState, setState, display]);

  const data = useMemo(
    () => [
      {
        label: "Started commands",
        data: cmds_per_sec.map((count, idx) => ({
          primary: idx,
          secondary: count[0],
        })),
      },
      {
        label: "Failed commands",
        data: cmds_per_sec.map((count, idx) => ({
          primary: idx,
          secondary: count[1],
        })),
      },
      {
        label: "Successful commands",
        data: cmds_per_sec.map((count, idx) => ({
          primary: idx,
          secondary: count[2],
        })),
      },
    ],
    [cmds_per_sec]
  );

  const primaryAxis = useMemo<
    AxisOptions<{
      primary: number;
      secondary: number;
    }>
  >(
    () => ({
      getValue: (datum) => datum.primary,
      scaleType: "linear",
      elementType: "line",
    }),
    []
  );

  const secondaryAxes = useMemo<
    AxisOptions<{
      primary: number;
      secondary: number;
    }>[]
  >(
    () => [
      {
        getValue: (datum) => datum.secondary,
        scaleType: "linear",
        elementType: "line",
      },
    ],
    []
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "5px",
        rowGap: "5px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <button onClick={() => setDisplay(DISPLAY_TYPES.MAIN)}>Back</button>
      </div>
      <Card>
        <Card.Header>Command Statistics</Card.Header>
        <Card.Body>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              rowGap: "5px",
              overflowX: "auto",
              height: "300px",
            }}
          >
            <Chart
              options={{
                data,
                primaryAxis,
                secondaryAxes,
              }}
            />
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
