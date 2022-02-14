import React from "react";
import CSS from "csstype";
import { GREEN_COLOR_THEME, RUSTY_COLOR_THEME } from "../constant";

const getBsonType = (value: any) => {
  if (typeof value === "object" && value === null) {
    return "null";
  } else if (typeof value === "object" && value !== null) {
    if (typeof value["$oid"] === "string") {
      return "ObjectID";
    } else if (typeof value["$date"]?.["$numberLong"] === "string") {
      return "DateTime";
    } else {
      return Array.isArray(value) ? "array" : "object";
    }
  } else {
    return typeof value;
  }
};

export type BsonViewerProps = {
  value: any;
};

type ObjectJsonViewerProps = {
  value: Record<string, unknown>;
};

const HORIZONTAL_STYLE: CSS.Properties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  borderStyle: "inset",
  borderColor: "black",
  borderWidth: "1px",
  borderRadius: "5px",
  backgroundColor: RUSTY_COLOR_THEME,
};

const collapsibleBsonTypes = (value: any) =>
  getBsonType(value) === "object" || getBsonType(value) === "array";

export class BsonObjectViewer extends React.PureComponent<
  ObjectJsonViewerProps,
  Record<string, boolean>
> {
  constructor(props: ObjectJsonViewerProps) {
    super(props);
    this.state = Object.fromEntries(
      Object.entries(props.value).map(([k, v]) => [k, collapsibleBsonTypes(v)])
    );
  }

  render() {
    const { value } = this.props;

    if (typeof value === "object" && value !== null) {
      if (Object.entries(value).length === 0 && Array.isArray(value)) {
        return <div>{"[]"}</div>;
      } else if (Object.entries(value).length === 0 && !Array.isArray(value)) {
        return <div>{"{}"}</div>;
      } else {
        return (
          <div style={HORIZONTAL_STYLE}>
            <table>
              <tbody>
                {Object.entries(value).map(([k, v]) => {
                  const hidden = collapsibleBsonTypes(v) && this.state[k];
                  return (
                    <tr style={{}} key={k}>
                      <td
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "space-between",
                          padding: "5px",
                          columnGap: "10px",
                        }}
                      >
                        <div>{k}</div>
                        {!collapsibleBsonTypes(v) ? (
                          <div
                            style={{
                              display: "flex",
                              borderRadius: "20px",
                              paddingTop: "4px",
                              paddingLeft: "7px",
                              paddingBottom: "4px",
                              paddingRight: "7px",
                              backgroundColor: GREEN_COLOR_THEME,
                            }}
                          >
                            {getBsonType(v)}
                          </div>
                        ) : (
                          <button
                            style={{
                              display: "flex",
                              backgroundColor: GREEN_COLOR_THEME,
                              borderRadius: "20px",
                            }}
                            onClick={() => {
                              this.setState((state) => {
                                return {
                                  ...state,
                                  [k]: state[k] ? false : true,
                                };
                              });
                            }}
                          >
                            {getBsonType(v)}
                          </button>
                        )}
                      </td>
                      <td
                        style={{
                          borderLeft: "1px solid black",
                          padding: "5px",
                        }}
                      >
                        <div hidden={!hidden}>...</div>
                        <div hidden={hidden}>
                          <BsonViewer value={v} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
    } else {
      return <div>Unknown type</div>;
    }
  }
}

export const BsonViewer = ({ value }: BsonViewerProps) => {
  if (typeof value === "bigint") {
    return <div>{value}</div>;
  } else if (typeof value === "boolean") {
    return <div>{value ? "true" : "false"}</div>;
  } else if (typeof value === "function") {
    return <div>{JSON.stringify(value)}</div>;
  } else if (typeof value === "number") {
    return <div>{value}</div>;
  } else if (typeof value === "object" && value === null) {
    return <div>null</div>;
  } else if (typeof value === "object" && value !== null) {
    if (typeof value["$oid"] === "string") {
      return <div>{value["$oid"]}</div>;
    } else if (typeof value["$date"]?.["$numberLong"] === "string") {
      return (
        <div>
          {new Date(parseInt(value["$date"]["$numberLong"])).toISOString()}
        </div>
      );
    } else {
      return <BsonObjectViewer value={value} />;
    }
  } else if (typeof value === "string") {
    return <div>{value}</div>;
  } else if (typeof value === "symbol") {
    return <div>{value}</div>;
  } else {
    return <div>Unknown type</div>;
  }
};
