import { Button } from "react-bootstrap";

import { ReactSetState, MongodbConnectInput } from "../types";

export type MongodbUrlBar = {
  url: string;
  setUrl: ReactSetState<string>;
  mongodb_connect: (input: MongodbConnectInput) => void;
};

const MongoDbUrlBar = ({
  url,
  setUrl,
  mongodb_connect,
}: Readonly<MongodbUrlBar>) => {
  return (
    <div
      style={{
        display: "flex",
        height: "50px",
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
          onClick={() => mongodb_connect({ mongodbUrl: url })}
        >
          Connect
        </Button>
        <Button
          variant="primary"
          onClick={() => mongodb_connect({ mongodbUrl: url })}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default MongoDbUrlBar;
