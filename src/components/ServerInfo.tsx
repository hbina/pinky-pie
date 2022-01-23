import { useEffect, useMemo, useState } from "react";
import { Card } from "react-bootstrap";
import CSS from "csstype";

import { DISPLAY_TYPES, VALUE_STATES } from "../types";
import { AppState } from "../App";
import { mongodb_server_info } from "../util";
import { AxisOptions, Chart } from "react-charts";
import { COLOR_THEME } from "../constant";

export type ServerInfoProps = {
  servers: {
    address: string;
    average_round_trip_time: string | undefined;
    last_update_time: string | undefined;
    max_wire_version: number | undefined;
    min_wire_version: number | undefined;
    replicat_set_name: string | undefined;
    replicate_set_version: number | undefined;
    server_type: string;
    tags: Record<string, string> | undefined;
  }[];
  heartbeat: {
    duration: [number, number][];
    document:
      | {
          connectionId: number;
          ismaster: boolean;
          localTime: {
            $date: {
              $numberLong: string;
            };
          };
          logicalSessionTimeoutMinutes: number;
          maxBsonObjectSize: number;
          maxMessageSizeBytes: number;
          maxWireVersion: number;
          maxWriteBatchSize: number;
          minWireVersion: number;
          ok: number;
          readOnly: boolean;
        }
      | undefined;
  };
};

export const SERVER_INFO_INITIAL_STATE: ServerInfoProps = {
  servers: [],
  heartbeat: {
    duration: Array.from({ length: 10 }, () => [0, 0]),
    document: undefined,
  },
};

export const useServerInfoState = () => {
  const [state, setState] = useState<ServerInfoProps>(
    SERVER_INFO_INITIAL_STATE
  );

  return {
    state,
    setState,
  };
};

export const ServerInfo = ({
  appStates: {
    connectionData: {
      state: { url, port, status: connectionState },
    },
    serverInfoState: {
      state: { servers, heartbeat },
      setState,
    },
    setDisplay,
  },
}: Readonly<{ appStates: AppState }>) => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      const f = async () => {
        try {
          if (connectionState === VALUE_STATES.LOADED) {
            const result = await mongodb_server_info();
            setState((state) => ({
              ...state,
              servers: result.servers,
              heartbeat: result.heartbeat,
            }));
          }
        } catch (e) {
          console.error(e);
        }
      };
      f();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [port, url, connectionState, servers, setState]);

  const data = useMemo(
    () => [
      {
        label: "Series 1",
        data: heartbeat.duration.map(([time, value], idx) => ({
          primary: idx,
          secondary: value,
        })),
      },
    ],
    [heartbeat.duration]
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
        label: "microseconds",
      },
    ],
    []
  );

  const tableCellStyle: CSS.Properties = {
    paddingRight: "10px",
    paddingLeft: "10px",
    border: "1px solid black",
  };

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
      {servers.length !== 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            columnGap: "5px",
            padding: "10px",
            overflowX: "auto",
          }}
        >
          {servers.map(({ address, server_type }, idx) => (
            <div
              key={address}
              style={{
                display: "flex",
                borderStyle: "inset",
                borderColor: "black",
                borderWidth: "1px",
                borderRadius: "10px",
                padding: "20px",
                backgroundColor: COLOR_THEME,
              }}
            >
              <table key={idx}>
                <tbody>
                  <tr key={1}>
                    <th style={tableCellStyle}>Address</th>
                    <td style={tableCellStyle}>{address}</td>
                  </tr>
                  <tr key={2}>
                    <th style={tableCellStyle}>Server type</th>
                    <td style={tableCellStyle}>{server_type}</td>
                  </tr>
                  {heartbeat.document && (
                    <tr key={3}>
                      <th style={tableCellStyle}>Is master</th>
                      <td style={tableCellStyle}>
                        {heartbeat.document.ismaster ? "true" : "false"}
                      </td>
                    </tr>
                  )}
                  {heartbeat.document && (
                    <tr key={4}>
                      <th style={tableCellStyle}>Is readonly</th>
                      <td style={tableCellStyle}>
                        {heartbeat.document.readOnly ? "true" : "false"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      <Card>
        <Card.Header>Heartbeat</Card.Header>
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
