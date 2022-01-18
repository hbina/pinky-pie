import { invoke } from "@tauri-apps/api";
import { cloneDeep } from "lodash";
import { useEffect, useState } from "react";
import { Card, Modal } from "react-bootstrap";

import { MongodbServerInformation, AppState } from "../types";

export type ServerInfoProps = {
  visible: boolean;
  serverInformation: MongodbServerInformation | undefined;
};

export const SERVER_INFO_INITIAL_STATE: ServerInfoProps = {
  visible: false,
  serverInformation: undefined,
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
      state: { url, port },
    },
    serverInfoState: {
      state: { visible, serverInformation },
      setState,
    },
  },
}: Readonly<{ appStates: AppState }>) => {
  useEffect(() => {
    const f = async () => {
      try {
        setState((state) => ({
          ...state,
          serverInformation: undefined,
        }));
        const result = await invoke<MongodbServerInformation>(
          "mongodb_server_description",
          {
            url,
            port,
          }
        );
        setState((state) => ({
          ...state,
          serverInformation: result,
        }));
      } catch (e) {
        console.error(e);
        setState(SERVER_INFO_INITIAL_STATE);
      }
    };
    f();
  }, [port, url, setState]);

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
        {serverInformation ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              rowGap: "5px",
            }}
          >
            <Card>
              <Card.Body>
                {serverInformation.address.Tcp ? (
                  <div>
                    <h6>Address Type</h6>
                    <p>Tcp</p>
                    <h6>Host {"&"} Port</h6>
                    <p>
                      {serverInformation.address.Tcp.host}:
                      {serverInformation.address.Tcp.port}
                    </p>
                  </div>
                ) : (
                  <div>Unknown address type</div>
                )}
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <div>
                  <h6>Server Type</h6>
                  <p>{serverInformation.server_type}</p>
                </div>
              </Card.Body>
            </Card>
          </div>
        ) : (
          <div>Not connected to any MongoDB service.</div>
        )}
      </Modal.Body>
      <Modal.Footer>Pinky Pie</Modal.Footer>
    </Modal>
  );
};
