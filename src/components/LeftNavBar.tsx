import { CollectionSpecification, DatabaseSpecification } from "../types";

import styles from "../App.module.css";

const LeftNavBar = ({
  databases,
  databaseCollections,
  list_collections,
  list_documents,
}: {
  databases: DatabaseSpecification[];
  databaseCollections: Record<string, CollectionSpecification[]>;
  list_collections: (databaseName: string) => Promise<void>;
  list_documents: (
    databaseName: string,
    collectionName: string
  ) => Promise<void>;
}) => {
  return (
    <div className={styles.LeftBoxCollectionList}>
      {databases.map(({ name: databaseName }) => (
        <div key={databaseName}>
          <div className={styles.MiddleButtonLayout}>
            <div className={styles.MiddleButtonHeaderLayout}>
              <text>{databaseName}</text>
              <button onClick={() => list_collections(databaseName)}>O</button>
            </div>
            {(databaseCollections[databaseName] ?? []).map(
              ({ name: collectionName }) => (
                <button
                  key={collectionName}
                  onClick={() => list_documents(databaseName, collectionName)}
                >
                  {collectionName}
                </button>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeftNavBar;
