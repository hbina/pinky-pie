import { useState } from "react";
import { Card, Modal } from "react-bootstrap";

import { MongodbServerInformation, AppState } from "../types";

export const useServerInfoState = () => {
  const [show, setShow] = useState(false);
  const [serverInformation, setServerInformation] = useState<
    MongodbServerInformation | undefined
  >(undefined);

  return {
    show,
    setShow,
    serverInformation,
    setServerInformation,
  };
};

export const ServerInfo = ({
  appStates: {
    serverInfoState: { show, setShow, serverInformation },
  },
}: Readonly<{ appStates: AppState }>) => {
  return (
    <Modal show={show} onHide={() => setShow(false)}>
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
