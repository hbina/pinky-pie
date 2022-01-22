import { cloneDeep } from "lodash";
import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";

import { VALUE_STATES } from "../types";
import { AppState } from "../App";
import { mongodb_n_slowest_commands, mongodb_server_metric } from "../util";

export type ServerMetricProps = {
  visible: boolean;
  status: VALUE_STATES;
  access_pattern: Record<
    number,
    {
      name: string;
      command: Record<string, unknown>;
      status:
        | {
            INITIATED: {};
          }
        | {
            SUCCESSFUL: {
              time_taken: number;
              reply: Record<string, unknown>;
            };
          }
        | {
            FAILED: {
              time_taken: number;
              message: string;
            };
          };
    }
  >;
};

export const SERVER_INFO_INITIAL_STATE: ServerMetricProps = {
  visible: false,
  status: VALUE_STATES.UNLOADED,
  access_pattern: {},
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
      state: { visible, status },
      setState,
    },
  },
}: Readonly<{ appStates: AppState }>) => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      const f = async () => {
        try {
          if (
            visible &&
            connectionState === VALUE_STATES.LOADED &&
            status === VALUE_STATES.UNLOADED
          ) {
            const result = await mongodb_server_metric();
            console.log("result", result);
            const slowest_commands = await mongodb_n_slowest_commands({
              count: 10,
            });
            console.log("slowest_commands", slowest_commands);
          }
        } catch (e) {
          console.error(e);
        }
      };
      f();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [port, url, connectionState, visible, status, setState]);

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
        <Modal.Title>Server Metric</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            rowGap: "5px",
          }}
        ></div>
      </Modal.Body>
    </Modal>
  );
};
