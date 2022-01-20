import { invoke } from "@tauri-apps/api";
import { cloneDeep } from "lodash";
import { useEffect, useState } from "react";
import { Card, Modal } from "react-bootstrap";

import { VALUE_STATES } from "../types";
import { AppState } from "../App";

export type ServerInfoProps = {
  visible: boolean;
  descriptions: { address: string; server_type: string }[];
  heartbeat:
    | {
        duration: number;
        document: {
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
        };
      }
    | undefined;
};

export const SERVER_INFO_INITIAL_STATE: ServerInfoProps = {
  visible: false,
  descriptions: [],
  heartbeat: undefined,
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
      state: { visible, descriptions, heartbeat },
      setState,
    },
  },
}: Readonly<{ appStates: AppState }>) => {
  useEffect(() => {
    const f = async () => {
      try {
        if (connectionState === VALUE_STATES.LOADED) {
          setState((state) => ({
            ...state,
            descriptions: [],
            hearbeat: undefined,
          }));
          const result = await invoke<Omit<ServerInfoProps, "duration">>(
            "mongodb_server_description"
          );
          setState((state) => ({
            ...state,
            descriptions: result.descriptions,
            heartbeat: result.heartbeat,
          }));
        }
      } catch (e) {
        console.error(e);
      }
    };
    f();
  }, [port, url, connectionState, setState]);

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
          {descriptions.length !== 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                columnGap: "5px",
              }}
            >
              {descriptions.map(({ address, server_type }) => (
                <Card key={address}>
                  <Card.Body>
                    <div>
                      <h6>Server type</h6>
                      <p>{server_type}</p>
                      <h6>Host {"&"} Port</h6>
                      <p>{address}</p>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
          {heartbeat && (
            <Card>
              <Card.Body>
                <div>
                  <h6>Duration</h6>
                  <p>{heartbeat.duration} milliseconds</p>
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
