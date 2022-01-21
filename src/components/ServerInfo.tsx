import { cloneDeep, isEmpty } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { Card, Modal } from "react-bootstrap";
import { Chart, AxisOptions } from "react-charts";
import { diff } from "deep-object-diff";

import { VALUE_STATES } from "../types";
import { AppState } from "../App";
import { mongodb_server_description } from "../util";

export type ServerInfoProps = {
  visible: boolean;
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
      state: { visible, servers, heartbeat },
      setState,
    },
  },
}: Readonly<{ appStates: AppState }>) => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      const f = async () => {
        try {
          if (visible && connectionState === VALUE_STATES.LOADED) {
            const result = await mongodb_server_description();
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
  }, [port, url, connectionState, servers, heartbeat, visible, setState]);

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

  return (
    <Modal
      show={visible}
      onHide={() =>
        setState((state) => ({
          ...cloneDeep(state),
          visible: false,
        }))
      }
    >
      <Modal.Header closeButton>
        <Modal.Title>Server information</Modal.Title>
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
              }}
            >
              {servers.map(({ address, server_type }) => (
                <Card key={address}>
                  <Card.Header>Server Information</Card.Header>
                  <Card.Body>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <p>{server_type}</p>
                      <p>{address}</p>
                    </div>
                  </Card.Body>
                </Card>
              ))}
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
          {heartbeat.document && (
            <Card>
              <Card.Header>Other Information</Card.Header>
              <Card.Body>
                <div>
                  <h6>Master</h6>
                  <p>{heartbeat.document.ismaster ? "true" : "false"}</p>
                  <h6>Readonly</h6>
                  <p>{heartbeat.document.readOnly ? "true" : "false"}</p>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <h5>Pinky Pie</h5>
      </Modal.Footer>
    </Modal>
  );
};
