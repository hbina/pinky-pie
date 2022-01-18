import "bootstrap/dist/css/bootstrap.min.css";

import { Stack, Tab, Tabs } from "react-bootstrap";
import { diff } from "deep-object-diff";

import { MongoDbUrlBar } from "./components/MongoDbUrlBar";
import { DocumentsTab } from "./components/DocumentsTab";
import { AggregateTab } from "./components/AggregateTab";
import { SchemaTab } from "./components/SchemaTab";
import { useAppState } from "./util";
import { AppState } from "./types";

let counter = 0;
let previousState: AppState | undefined = undefined;

const App = () => {
  const appStates = useAppState();
  const {
    window: { height },
    connectionData: {
      state: { databaseName, collectionName },
    },
  } = appStates;

  if (previousState) {
    console.log("counter", counter, "diff", diff(previousState, appStates));
  } else {
    console.log("counter", counter, "no diff");
  }
  previousState = appStates;
  counter += 1;

  return (
    <Stack
      direction="vertical"
      style={{
        padding: "5px",
        rowGap: "5px",
        height: height,
      }}
    >
      <MongoDbUrlBar appStates={appStates} />
      <div hidden={databaseName && collectionName ? false : true}>
        <Tabs defaultActiveKey="document_listing_tab">
          <Tab eventKey="document_listing_tab" title="Documents">
            <DocumentsTab appStates={appStates} />
          </Tab>
          <Tab eventKey="document_aggregation_tab" title="Aggregation">
            <AggregateTab appStates={appStates} />
          </Tab>
          <Tab eventKey="document_schema_tab" title="Schema">
            <SchemaTab appStates={appStates} />
          </Tab>
        </Tabs>
      </div>
    </Stack>
  );
};

export default App;
