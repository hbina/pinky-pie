import { Dropdown, Pagination } from "react-bootstrap";

import {
  CollectionSpecification,
  DatabaseSpecification,
  ReactSetState,
} from "../types";

export type DatabaseCollectionBarProp = {
  url: string;
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

const DatabaseCollectionBar = ({
  url,
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
}: Readonly<DatabaseCollectionBarProp>) => {
  const hidePaginationInfo = databaseName && collectionName ? false : true;
  const paginationInfo = `${perPage * page + 1} - ${Math.min(
    perPage * (page + 1),
    documentsCount
  )} of ${documentsCount}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        height: "50px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
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
          disabled={true}
        />
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
      <div
        hidden={hidePaginationInfo}
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          columnGap: "5px",
          padding: "5px",
          alignItems: "center",
        }}
      >
        <p>{paginationInfo}</p>
        <Pagination>
          <Pagination.Prev
            onClick={() => setPage((page) => Math.max(0, page - 1))}
          />
          <Pagination.Next
            onClick={() =>
              setPage((page) =>
                Math.min(Math.floor(documentsCount / perPage), page + 1)
              )
            }
          />
        </Pagination>
      </div>
    </div>
  );
};

export default DatabaseCollectionBar;
