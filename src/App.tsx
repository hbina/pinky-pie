import "bootstrap/dist/css/bootstrap.min.css";

import { diff } from "deep-object-diff";

import { useAggregateTabState } from "./components/AggregateTab";
import { useDocumentsTabState } from "./components/DocumentsTab";
import { useMongodbUrlBarState } from "./components/MongoDbUrlBar";
import { useSchemaTabState } from "./components/SchemaTab";
import { useServerInfoState } from "./components/ServerInfo";
import { MongoDbUrlBar } from "./components/MongoDbUrlBar";
import { DocumentsTab } from "./components/DocumentsTab";
import { AggregateTab } from "./components/AggregateTab";
import { SchemaTab } from "./components/SchemaTab";
import { useWindowDimensions } from "./util";
import { TabView, TabViewRow } from "./components/TabView";
import { useServerMetricState } from "./components/ServerMetric";

let counter = 0;
let previousState: AppState | undefined = undefined;

export type AppState = ReturnType<typeof useAppState>;

export const useAppState = () => {
  const { width, height } = useWindowDimensions();
  const connectionData = useMongodbUrlBarState();
  const documentsTabState = useDocumentsTabState();
  const aggregateTabState = useAggregateTabState();
  const serverInfoState = useServerInfoState();
  const serverMetricState = useServerMetricState();
  const schemaTabState = useSchemaTabState();

  return {
    window: { width, height },
    connectionData,
    documentsTabState,
    aggregateTabState,
    serverInfoState,
    serverMetricState,
    schemaTabState,
  };
};

const App = () => {
  const appStates = useAppState();
  const {
    window: { height },
    connectionData: {
      state: { databaseName, collectionName },
    },
  } = appStates;

  if (previousState) {
    const difference = diff(previousState, appStates);
    console.log("counter", counter, "diff", difference);
  } else {
    console.log("counter", counter, "no diff");
  }
  previousState = appStates;
  counter += 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "5px",
        rowGap: "5px",
        height: height,
      }}
    >
      <MongoDbUrlBar appStates={appStates} />
      <div hidden={databaseName && collectionName ? false : true}>
        <TabView>
          <TabViewRow eventKey="Documents">
            <DocumentsTab appStates={appStates} />
          </TabViewRow>
          <TabViewRow eventKey="Aggregation">
            <AggregateTab appStates={appStates} />
          </TabViewRow>
          <TabViewRow eventKey="Schema">
            <SchemaTab appStates={appStates} />
          </TabViewRow>
        </TabView>
      </div>
    </div>
  );
};

export default App;
