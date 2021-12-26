import { Button } from "react-bootstrap";

import styles from "../App.module.css";
import { ReactSetState } from "../types";

const TopNavBar = ({
  url,
  setUrl,
  disableInput,
  connect_mongodb,
}: {
  url: string;
  setUrl: ReactSetState<string>;
  disableInput: boolean;
  connect_mongodb: (mongodbUrl: string) => Promise<void>;
}) => {
  return (
    <div className={styles.TopNavBarBox}>
      <div className={styles.TopNavBarContent}>
        <input
          className={styles.TopNavBarUrlInput}
          value={url}
          disabled={disableInput}
          placeholder="MongoDB URL"
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button
          className={styles.TopNavBarConnectButton}
          variant="primary"
          onClick={() => connect_mongodb(url)}
          disabled={disableInput}
        >
          Connect
        </Button>
        <Button
          className={styles.TopNavBarRefreshButton}
          variant="primary"
          onClick={() => connect_mongodb(url)}
          disabled={!disableInput}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default TopNavBar;
