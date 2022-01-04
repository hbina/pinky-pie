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

const DatabaseCollectionBar = () => <div></div>;

export default DatabaseCollectionBar;
