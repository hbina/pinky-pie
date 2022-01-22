import { cloneDeep, isEmpty } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { Card, Modal } from "react-bootstrap";
import { diff } from "deep-object-diff";
import CSS from "csstype";

import { VALUE_STATES } from "../types";
import { AppState } from "../App";
import { mongodb_server_info } from "../util";
import { AxisOptions, Chart } from "react-charts";

export type ServerInfoProps = {
  visible: boolean;
  status: VALUE_STATES;
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
  visible: false,
  status: VALUE_STATES.UNLOADED,
  servers: [],
  heartbeat: {
    duration: [],
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
      state: { visible, status, servers, heartbeat },
      setState,
    },
  },
}: Readonly<{ appStates: AppState }>) => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      const f = async () => {
        try {
          if (
            connectionState === VALUE_STATES.LOADED &&
            status === VALUE_STATES.UNLOADED
          ) {
            setState((state) => ({
              ...state,
              status: VALUE_STATES.LOADING,
              servers: [],
              heartbeat: {
                duration: [],
                document: undefined,
              },
            }));
            const result = await mongodb_server_info();
            const difference = diff(
              {
                servers: result.servers,
                heartbeat: result.heartbeat,
              },
              {
                servers,
                heartbeat,
              }
            );
            if (!isEmpty(difference)) {
              setState((state) => ({
                ...state,
                status: VALUE_STATES.LOADED,
                servers: result.servers,
                heartbeat: result.heartbeat,
              }));
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      f();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [
    port,
    url,
    connectionState,
    servers,
    heartbeat,
    visible,
    status,
    setState,
  ]);

  const data = useMemo(
    () => [
      {
        label: "Series 1",
        data: heartbeat.duration.map(([time, value], idx, arr) => ({
          primary: time - arr[0][0],
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
    <Modal
      show={visible}
      onHide={() =>
        setState((state) => ({
          ...cloneDeep(state),
          visible: false,
        }))
      }
      style={{}}
    >
      <Modal.Header closeButton>
        <Modal.Title>Server Info</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            rowGap: "5px",
          }}
        >
          {servers.length !== 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                columnGap: "5px",
                border: "",
                borderStyle: "inset",
                borderRadius: "5px",
                borderColor: "black",
                borderWidth: 1,
                padding: "10px",
                overflowX: "auto",
              }}
            >
              {[...servers, ...servers, ...servers, ...servers].map(
                ({ address, server_type }) => (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "900px",
                    }}
                  >
                    <table>
                      <tr>
                        <th style={tableCellStyle}>Server type</th>
                        <td style={tableCellStyle}>{server_type}</td>
                      </tr>
                      <tr>
                        <th style={tableCellStyle}>Address</th>
                        <td style={tableCellStyle}>{address}</td>
                      </tr>
                      {heartbeat.document && (
                        <tr>
                          <th style={tableCellStyle}>Is master</th>
                          <td style={tableCellStyle}>
                            {heartbeat.document.ismaster ? "true" : "false"}
                          </td>
                        </tr>
                      )}
                      {heartbeat.document && (
                        <tr>
                          <th style={tableCellStyle}>Is readonly</th>
                          <td style={tableCellStyle}>
                            {heartbeat.document.readOnly ? "true" : "false"}
                          </td>
                        </tr>
                      )}
                    </table>
                  </div>
                )
              )}
            </div>
          )}
          {data.length !== 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
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
                </Card.Body>{" "}
              </Card>
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};
