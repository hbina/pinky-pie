import { ReactElement, useState } from "react";

export const TabView = (props: {
  children: ReactElement<{ eventKey: string }>[];
}) => {
  const [key, setKey] = useState(props.children[0].props.eventKey);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          columnGap: "5px",
        }}
      >
        {props.children.map((c, idx) => (
          <button
            key={idx}
            disabled={c.props.eventKey === key}
            onClick={() => setKey(c.props.eventKey)}
          >
            {c.props.eventKey}
          </button>
        ))}
      </div>
      <>
        {props.children.map((c) => (
          <div key={c.props.eventKey} hidden={c.props.eventKey !== key}>
            {c}
          </div>
        ))}
      </>
    </>
  );
};
export const TabViewRow = (props: {
  eventKey: string;
  children: JSX.Element;
}) => props.children;
