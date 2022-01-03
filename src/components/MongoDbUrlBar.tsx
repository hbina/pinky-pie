import { Button, Dropdown } from "react-bootstrap";

import {
  ReactSetState,
  MongodbConnectInput,
  DatabaseSpecification,
  CollectionSpecification,
} from "../types";

export type MongodbUrlBar = {
  url: string;
  setUrl: ReactSetState<string>;
  urlConnected: boolean;
  mongodb_connect: (input: MongodbConnectInput) => void;
  databases: DatabaseSpecification[];
  databaseCollections: Record<string, CollectionSpecification[]>;
  documentsCount: number;
  databaseName: string;
  setDatabaseName: ReactSetState<string>;
  collectionName: string;
  setCollectionName: ReactSetState<string>;
  page: number;
  setPage: ReactSetState<number>;
  perPage: number;
};

const MongoDbUrlBar = ({
  url,
  setUrl,
  urlConnected,
  mongodb_connect,
  databases,
  databaseCollections,
  documentsCount,
  databaseName,
  setDatabaseName,
  collectionName,
  setCollectionName,
  page,
  setPage,
  perPage,
}: Readonly<MongodbUrlBar>) => {
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
        }}
      >
        <input
          style={{
            display: "flex",
            width: "250px",
          }}
          disabled={urlConnected}
          value={url}
          placeholder="MongoDB URL"
          onChange={(e) => setUrl(e.target.value)}
        />
        <div>
          {urlConnected ? (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                columnGap: "5px",
              }}
            >
              <Dropdown>
                <Dropdown.Toggle>{databaseName}</Dropdown.Toggle>
                <Dropdown.Menu>
                  {databases.map(({ name }) => (
                    <Dropdown.Item
                      key={name}
                      onClick={() => {
                        setDatabaseName(name);
                        setCollectionName("");
                      }}
                    >
                      {name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              <Dropdown>
                <Dropdown.Toggle>{collectionName}</Dropdown.Toggle>
                <Dropdown.Menu>
                  {(databaseCollections[databaseName] ?? []).map(({ name }) => (
                    <Dropdown.Item
                      key={name}
                      onClick={() => {
                        setCollectionName(name);
                        setPage(0);
                      }}
                    >
                      {name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          ) : (
            <div>
              <Button
                variant="primary"
                onClick={() => mongodb_connect({ mongodbUrl: url })}
              >
                Connect
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MongoDbUrlBar;
