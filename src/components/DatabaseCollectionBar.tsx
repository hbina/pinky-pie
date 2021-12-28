import { DebouncedFunc } from "lodash";
import React, { useEffect, useState } from "react";
import { Dropdown, Button } from "react-bootstrap";

import { CollectionSpecification, DatabaseSpecification } from "../types";

const DatabaseCollectionBar = ({
  databases,
  databaseCollections,
  list_collections,
  list_documents,
}: {
  databases: DatabaseSpecification[];
  databaseCollections: Record<string, CollectionSpecification[]>;
  list_collections: DebouncedFunc<(databaseName: string) => Promise<void>>;
  list_documents: DebouncedFunc<
    (
      databaseName: string,
      collectionName: string,
      perPage: number,
      page: number
    ) => Promise<void>
  >;
}) => {
  const [databaseName, setDatabaseName] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);

  /*
  useEffect(() => {
    if (databaseName) list_collections(databaseName);
    if (databaseName && collectionName)
      list_documents(databaseName, collectionName, page, perPage);
  }, [
    databaseName,
    collectionName,
    page,
    perPage,
    list_collections,
    list_documents,
  ]);
  */

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        columnGap: "5px",
        padding: "5px",
      }}
    >
      <Dropdown>
        <Dropdown.Toggle>{databaseName}</Dropdown.Toggle>
        <Dropdown.Menu>
          {databases.map(({ name }) => (
            <Dropdown.Item
              onClick={() => {
                setDatabaseName(name);
                list_collections(name);
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
              onClick={() => {
                setCollectionName(name);
                if (databaseName)
                  list_documents(databaseName, name, page, perPage);
              }}
            >
              {name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
      <Button
        onClick={() => {
          setPage((page) => Math.max(1, page - 1));
          if (databaseName && collectionName)
            list_documents(databaseName, collectionName, page, perPage);
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z" />
        </svg>
      </Button>
      <p>
        page:{page} perPage:{perPage}
      </p>
      <Button
        onClick={() => {
          setPage((page) => page + 1);
          if (databaseName && collectionName)
            list_documents(databaseName, collectionName, page, perPage);
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z" />
        </svg>
      </Button>
    </div>
  );
};

export default DatabaseCollectionBar;
