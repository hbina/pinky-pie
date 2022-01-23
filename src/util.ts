import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api";

import { BsonDocument, DatabaseSpecification } from "./types";
import { ServerInfoProps } from "./components/ServerInfo";

async function apiCall<O>(
  funName: string,
  args: Record<string, unknown>
): Promise<O> {
  const result = await invoke<O>(funName, args);
  // console.log(`calling ${funName} with`, args, " result", result);
  return result;
}

const getWindowDimensions = () => {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
};

export const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
};

export const mongodb_aggregate_documents = async ({
  databaseName,
  collectionName,
  idx,
  sampleCount,
  stages,
}: {
  databaseName: string;
  collectionName: string;
  idx: number;
  sampleCount: number;
  stages: { stageBody: string; stageOperation: string }[];
}) =>
  apiCall<BsonDocument[]>("mongodb_aggregate_documents", {
    databaseName,
    collectionName,
    stages: [
      {
        $limit: sampleCount,
      },
      ...stages.map(({ stageBody, stageOperation }) => ({
        [stageOperation]: JSON.parse(stageBody),
      })),
    ],
  });

export const mongodb_connect = async (args: { url: string; port: number }) =>
  apiCall<Record<string, DatabaseSpecification>>("mongodb_connect", args);

export const mongodb_find_documents = async (args: {
  databaseName: string;
  collectionName: string;
  page: number;
  perPage: number;
  documentsFilter: Record<string, unknown>;
  documentsProjection: Record<string, unknown>;
  documentsSort: Record<string, unknown>;
}) => apiCall<BsonDocument[]>("mongodb_find_documents", args);

export const mongodb_count_documents = async (args: {
  databaseName: string;
  collectionName: string;
  documentsFilter: Record<string, unknown>;
}) => apiCall<number>("mongodb_count_documents", args);

export const mongodb_get_database_topology = async () =>
  apiCall<ServerInfoProps["servers"]>("mongodb_get_database_topology", {});

export const mongodb_get_connection_heartbeat = async () =>
  apiCall<ServerInfoProps["heartbeat"]>("mongodb_get_connection_heartbeat", {});

export const mongodb_n_slowest_commands = async (args: { count: number }) =>
  apiCall<any>("mongodb_n_slowest_commands", args);

export const mongodb_get_commands_statistics_per_sec = async (args: {
  count: number;
}) =>
  apiCall<[number, number, number][]>(
    "mongodb_get_commands_statistics_per_sec",
    args
  );
