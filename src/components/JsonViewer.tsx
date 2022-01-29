import { Badge } from "react-bootstrap";
import CSS from "csstype";

const getBsonType = (value: any) => {
  if (typeof value === "object" && value === null) {
    return (
      <Badge pill bg="primary">
        null
      </Badge>
    );
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

export const JsonViewer = ({ value }: { value: any }) => {
  const horizontalStyle: CSS.Properties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  };
  if (typeof value === "bigint") {
    return <div>{value}</div>;
  } else if (typeof value === "boolean") {
    return <div>{value ? "true" : "false"}</div>;
  } else if (typeof value === "function") {
    return <div>{JSON.stringify(value)}</div>;
  } else if (typeof value === "number") {
    return <div>{value ? "true" : "false"}</div>;
  } else if (typeof value === "object" && value === null) {
    return <div></div>;
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
      return (
        <div style={horizontalStyle}>
          <table>
            <tbody>
              {Object.entries(value).map(([k, v]) => (
                <tr
                  style={{
                    border: "1px solid black",
                  }}
                  key={k}
                >
                  <td
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>{k}</div>
                    <Badge pill bg="primary">
                      {getBsonType(v)}
                    </Badge>
                  </td>
                  <td
                    style={{
                      borderLeft: "1px solid black",
                    }}
                  >
                    <JsonViewer value={v} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  } else if (typeof value === "string") {
    return <div>{value}</div>;
  } else if (typeof value === "symbol") {
    return <div>{value}</div>;
  } else {
    return <div>Unknown type</div>;
  }
};
