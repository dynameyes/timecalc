import React from "react";
import { Collapse } from "react-collapse";

export const CollapseWithHeader = ({ children, title, defaultOpen }) => {
  const [isOpen, setIsOpen] = React.useState(!!defaultOpen);

  return (
    <>
      <div
        style={{
          cursor: "pointer"
        }}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center"
          }}
          onMouseDown={e => e.preventDefault()}
        >
          <div
            style={{
              marginRight: 10,
              fontWeight: "bolder"
            }}
          >
            {isOpen ? "[CLOSE]" : "[OPEN]"}
          </div>
          {title}
        </div>
      </div>
      <Collapse isOpened={isOpen}>{children}</Collapse>
    </>
  );
};
