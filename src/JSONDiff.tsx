import React, { Component, CSSProperties } from "react";
import JSONTree from "react-json-tree";
import { Delta } from "jsondiffpatch";
import { Base16Theme } from "react-base16-styling";
import { isCollection, isIndexed, isKeyed } from "immutable";
import { base16Theme } from "./base16theme";

const IS_IMMUTABLE_KEY = "@@__IS_IMMUTABLE__@@";

function isIterable(obj: any) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    !Array.isArray(obj) &&
    typeof obj[window.Symbol.iterator] === "function"
  );
}

function isImmutable(value: any) {
  return isKeyed(value) || isIndexed(value) || isCollection(value);
}

function getShortTypeString(val: any, diff: boolean | undefined) {
  if (diff && Array.isArray(val)) {
    val = val[val.length === 2 ? 1 : 0];
  }

  if (isIterable(val) && !isImmutable(val)) {
    return "(…)";
  } else if (Array.isArray(val)) {
    return val.length > 0 ? "[…]" : "[]";
  } else if (val === null) {
    return "null";
  } else if (val === undefined) {
    return "undef";
  } else if (typeof val === "object") {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return Object.keys(val as {}).length > 0 ? "{…}" : "{}";
  } else if (typeof val === "function") {
    return "fn";
  } else if (typeof val === "string") {
    return `"${val.substr(0, 10) + (val.length > 10 ? "…" : "")}"`;
  } else if (typeof val === "symbol") {
    return "symbol";
  } else {
    return val;
  }
}

function getText(
  type: string,
  data: any,
  isWideLayout: boolean,
  isDiff: boolean | undefined
) {
  if (type === "Object") {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const keys = Object.keys(data as {});
    if (!isWideLayout) return keys.length ? "{…}" : "{}";

    const str = keys
      .slice(0, 3)
      .map(
        (key) => `${key}: ${getShortTypeString(data[key], isDiff) as string}`
      )
      .concat(keys.length > 3 ? ["…"] : [])
      .join(", ");

    return `{ ${str} }`;
  } else if (type === "Array") {
    if (!isWideLayout) return data.length ? "[…]" : "[]";

    const str = data
      .slice(0, 4)
      .map((val: any) => getShortTypeString(val, isDiff))
      .concat(data.length > 4 ? ["…"] : [])
      .join(", ");

    return `[${str as string}]`;
  } else {
    return type;
  }
}

const getItemString = (
  type: string,
  data: any,
  dataTypeKey: string | symbol | undefined,
  isWideLayout: boolean,
  isDiff?: boolean
) => (
  <span style={{ color: colors.neutral }}>
    {data[IS_IMMUTABLE_KEY] ? "Immutable" : ""}
    {dataTypeKey && data[dataTypeKey] ? `${data[dataTypeKey] as string} ` : ""}
    {getText(type, data, isWideLayout, isDiff)}
  </span>
);

function stringifyAndShrink(val: any, isWideLayout?: boolean) {
  if (val === null) {
    return "null";
  }

  const str = JSON.stringify(val);
  if (typeof str === "undefined") {
    return "undefined";
  }

  if (isWideLayout)
    return str.length > 42 ? str.substr(0, 30) + "…" + str.substr(-10) : str;
  return str.length > 22 ? `${str.substr(0, 15)}…${str.substr(-5)}` : str;
}

const expandFirstLevel = (
  keyName: (string | number)[],
  data: any,
  level: number
) => true;

function prepareDelta(value: any) {
  if (value && value._t === "a") {
    const res: { [key: string]: any } = {};
    for (const key in value) {
      if (key !== "_t") {
        if (key[0] === "_" && !value[key.substr(1)]) {
          res[key.substr(1)] = value[key];
        } else if (value["_" + key]) {
          res[key] = [value["_" + key][0], value[key][0]];
        } else if (!value["_" + key] && key[0] !== "_") {
          res[key] = value[key];
        }
      }
    }
    return res;
  }

  return value;
}

interface Props {
  theme: Base16Theme;
  delta: Delta | null | undefined | false;
  isWideLayout: boolean;
  invertTheme?: boolean;
  collectionLimit?: number;
  labelRenderer: (
    keyPath: (string | number)[],
    nodeType: string,
    expanded: boolean,
    expandable: boolean
  ) => React.ReactNode;
  keyPath?: (string | number)[];
  dataTypeKey: string | symbol | undefined;
}

interface State {
  data: any;
}

const colors = {
  add: base16Theme.base0B,
  remove: base16Theme.base08,
  neutral: base16Theme.base04,
  black: base16Theme.base00,
};

const diffStyles: { [key: string]: CSSProperties } = {
  diffWrap: {
    position: "relative",
    zIndex: 1,
  },

  diffAdd: {
    backgroundColor: colors.add,
  },

  diffRemove: {
    textDecoration: "line-through",
    backgroundColor: colors.remove,
  },

  diffUpdateFrom: {
    textDecoration: "line-through",
    backgroundColor: colors.remove,
  },

  diffUpdateTo: {
    backgroundColor: colors.add,
  },

  diffUpdateArrow: {
    color: colors.neutral,
  },
};

export default class JSONDiff extends Component<Props, State> {
  render() {
    const { ...props } = this.props;

    if (!this.props.delta) {
      return (
        <div
          style={{
            padding: "10px",

            color: colors.neutral,
          }}
        >
          (states are equal)
        </div>
      );
    }
    return (
      <JSONTree
        {...props}
        data={this.props.delta}
        getItemString={this.getItemString}
        valueRenderer={this.valueRenderer}
        collectionLimit={this.props.collectionLimit}
        postprocessValue={prepareDelta}
        isCustomNode={Array.isArray}
        shouldExpandNode={expandFirstLevel}
        hideRoot
      />
    );
  }

  getItemString = (type: string, data: any) =>
    getItemString(
      type,
      data,
      this.props.dataTypeKey,
      this.props.isWideLayout,
      true
    );

  valueRenderer = (raw: any, value: any) => {
    const { isWideLayout } = this.props;

    function renderSpan(name: keyof typeof diffStyles, body: string) {
      return (
        <span
          key={name}
          style={{
            ...{
              padding: "2px 3px",
              borderRadius: "3px",
              position: "relative",

              color: colors.black,
            },
            ...diffStyles[name],
          }}
        >
          {body}
        </span>
      );
    }

    if (Array.isArray(value)) {
      switch (value.length) {
        case 1:
          return (
            <span
              style={{
                position: "relative",
                zIndex: 1,
              }}
            >
              {renderSpan(
                "diffAdd",
                stringifyAndShrink(value[0], isWideLayout)
              )}
            </span>
          );
        case 2:
          return (
            <span
              style={{
                position: "relative",
                zIndex: 1,
              }}
            >
              {renderSpan(
                "diffUpdateFrom",
                stringifyAndShrink(value[0], isWideLayout)
              )}
              {renderSpan("diffUpdateArrow", " => ")}
              {renderSpan(
                "diffUpdateTo",
                stringifyAndShrink(value[1], isWideLayout)
              )}
            </span>
          );
        case 3:
          return (
            <span
              style={{
                position: "relative",
                zIndex: 1,
              }}
            >
              {renderSpan("diffRemove", stringifyAndShrink(value[0]))}
            </span>
          );
      }
    }

    return raw;
  };
}
