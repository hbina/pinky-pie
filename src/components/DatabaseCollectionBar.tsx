import { DebouncedFunc } from "lodash";
import { useEffect, useState } from "react";
import {
  Dropdown,
  Button,
  ButtonGroup,
  InputGroup,
  FormControl,
  Pagination,
} from "react-bootstrap";

import {
  CollectionSpecification,
  DatabaseSpecification,
  ListCollectionsInput,
  ListDocumentsInput,
} from "../types";

const DatabaseCollectionBar = ({
  databases,
  databaseCollections,
  list_collections,
  list_documents,
}: {
  databases: DatabaseSpecification[];
  databaseCollections: Record<string, CollectionSpecification[]>;
  list_collections: (input: ListCollectionsInput) => void;
  list_documents: (input: ListDocumentsInput) => void;
}) => {
  const [databaseName, setDatabaseName] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [perPage] = useState(5);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (databaseName && collectionName)
      list_documents({ databaseName, collectionName, page, perPage });
  }, [databaseName, collectionName, page, perPage, list_documents]);

  useEffect(() => {
    if (databaseName) list_collections({ databaseName });
  }, [databaseName, list_collections]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
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
        <Dropdown>
          <Dropdown.Toggle>{databaseName}</Dropdown.Toggle>
          <Dropdown.Menu>
            {databases.map(({ name }, idx) => (
              <Dropdown.Item
                key={idx}
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
            {(databaseCollections[databaseName] ?? []).map(({ name }, idx) => (
              <Dropdown.Item key={idx} onClick={() => setCollectionName(name)}>
                {name}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          columnGap: "5px",
          padding: "5px",
        }}
      >
        <p>perPage: {perPage}</p>
        <Pagination>
          <Pagination.Prev
            onClick={() => setPage((page) => Math.max(0, page - 1))}
          />
          <Pagination.Item disabled>{page}</Pagination.Item>
          <Pagination.Next onClick={() => setPage((page) => page + 1)} />
        </Pagination>
      </div>
    </div>
  );
};

export default DatabaseCollectionBar;
