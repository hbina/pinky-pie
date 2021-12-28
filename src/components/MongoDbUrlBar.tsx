import { Button } from "react-bootstrap";

import { ReactSetState, MongodbConnectInput } from "../types";

const MongoDbUrlBar = ({
  url,
  setUrl,
  connect_mongodb,
}: Readonly<{
  url: string;
  setUrl: ReactSetState<string>;
  connect_mongodb: (input: MongodbConnectInput) => void;
}>) => {
  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          columnGap: "5px",
          padding: "5px",
        }}
      >
        <input
          style={{
            display: "flex",
            padding: "5px",
            width: "250px",
          }}
          value={url}
          placeholder="MongoDB URL"
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button
          variant="primary"
          onClick={() => connect_mongodb({ mongodbUrl: url })}
        >
          Connect
        </Button>
        <Button
          variant="primary"
          onClick={() => connect_mongodb({ mongodbUrl: url })}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default MongoDbUrlBar;
