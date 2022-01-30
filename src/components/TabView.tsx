import { useState } from "react";

// FIXME: Fix the type annotations for the children here...

export const TabView = (props: { children: any[] }) => {
  const flatten_children = props.children.flat();
  const [key, setKey] = useState<string>(flatten_children[0].props.eventKey);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          columnGap: "5px",
          paddingBottom: "5px",
          borderBottom: "1px solid black",
        }}
      >
        {flatten_children.map((c, idx) => (
          <button
            key={idx}
            disabled={c.props.eventKey === key}
            onClick={() =>
              c.props.onClick ? c.props.onClick() : setKey(c.props.eventKey)
            }
          >
            {c.props.eventKey}
          </button>
        ))}
      </div>
      <>
        {flatten_children.map((c) => (
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
  children: any;
  onClick?: () => void;
}) => props.children;
