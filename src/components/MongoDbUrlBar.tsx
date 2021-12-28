import { DebouncedFunc } from "lodash";
import { Button } from "react-bootstrap";

import { ReactSetState } from "../types";

const MongoDbUrlBar = ({
  url,
  setUrl,
  connect_mongodb,
}: {
  url: string;
  setUrl: ReactSetState<string>;
  connect_mongodb: DebouncedFunc<(mongodbUrl: string) => Promise<void>>;
}) => {
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
        <Button variant="primary" onClick={() => connect_mongodb(url)}>
          Connect
        </Button>
        <Button variant="primary" onClick={() => connect_mongodb(url)}>
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default MongoDbUrlBar;
