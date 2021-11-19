import styled from "styled-components";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";

import { Store } from "redux";
import JSONTree from "react-json-tree";
import * as localforage from "localforage";
import JSONDiff from "./JSONDiff";
import { base16Theme } from "./base16theme";
import React from "react";
import { loggerState } from "./integratedLogger";
import { getItemString } from "./GetItemString";

const Popup = styled.div`
  height: 40%;
  width: 100%;
  background-color: white;
  display: flex;
  contain: content;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 4px;
  color: white;
  background-color: darkblue;
  display: flex;
  justify-content: space-between;
`;

const ActionPanel = styled.div`
  width: 40%;
  overflow: auto;
  height: 100%;
  border-right: 1px solid black;
`;

const ActionDetail = styled.div`
  width: 60%;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const MenuItem = styled.div`
  margin-left: 8px;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const Menu = styled.div`
  display: flex;
`;

const Tabs = styled.div`
  width: 100%;
  display: flex;
  div {
    padding: 4px 12px;
    background-color: gray;
    cursor: pointer;
    &.selected {
      background-color: ${base16Theme.base0A};
    }
    &:hover {
      background-color: lightcyan;
    }
  }
`;

const Scroll = styled.div`
  flex: 1;
  overflow: auto;
`;

const Filter = styled.div`
  background: ${base16Theme.base04};
  display: flex;
  font-size: 80%;
  color: #666;
  .path-item {
    cursor: pointer;
    &:hover {
      color: ${base16Theme.base04};
    }
    padding: 2px 4px 2px 10px;
    position: relative;
    &::after {
      content: " ";
      display: block;
      width: 0;
      height: 0;
      border-top: 10px solid transparent; /* Go big on the size, and let overflow hide */
      border-bottom: 10px solid transparent;
      border-left: 5px solid hsla(34, 85%, 35%, 1);
      position: absolute;
      top: 50%;
      margin-top: -10px;
      left: 100%;
      z-index: 2;
    }
  }
  .path-item:nth-child(4n + 1) {
    background-color: #bbb;
    &::after {
      border-left-color: #bbb;
    }
  }
  .path-item:nth-child(4n + 2) {
    background-color: #ccc;
    &::after {
      border-left-color: #ccc;
    }
  }
  .path-item:nth-child(4n + 3) {
    background-color: #ddd;
    &::after {
      border-left-color: #ddd;
    }
  }
  .path-item:nth-child(4n + 4) {
    background-color: #eee;
    &::after {
      border-left-color: #eee;
    }
  }
`;

const Clear = styled.div`
  padding: 2px 4px;
  margin-left: auto;
  background-color: #bbb;
  cursor: pointer;
  &:hover {
    color: ${base16Theme.base04};
  }
`;

const DiffTime = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
`;

const ActionItem = styled.div<{ selected: boolean }>`
  padding: 4px;
  cursor: pointer;
  position: relative;
  background-color: ${(props) =>
    props.selected ? base16Theme.base0A : "transparent"};
  &:hover {
    background-color: lightcyan;
  }
`;

const NodeAction = styled.span`
  text-decoration: underline;
  cursor: pointer;
  color: ${base16Theme.base0A};
  &:hover {
    color: ${base16Theme.base0C};
  }
`;

const Label = styled.span`
  color: ${base16Theme.base0D};
`;

let timeout: number | undefined;

export const StoreActions = (props: {
  store: Store;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const history = loggerState.actionHistory;

  const [tab, setTab] = useState("diff");
  const [filterPath, setFilterPath] = useState([]);
  const [version, setVersion] = useState(Math.random());
  const [current, setCurrent] = useState<any>(undefined);
  const actionList = useRef<HTMLDivElement>(null);

  props.store.subscribe(() => {
    if (timeout) {
      window.clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      setVersion(Math.random());
    }, 500);
  });

  useEffect(() => {
    if (actionList.current) {
      actionList.current.scrollTop = actionList.current.scrollHeight;
    }
  }, [version]);

  const renderLabel = useCallback(
    (keyPath, nodeType, expanded, expandable) => {
      const name = keyPath[0];
      return (
        <Label>
          {name}{" "}
          <NodeAction
            onClick={(e) => {
              e.stopPropagation();
              setFilterPath((filterPath) => {
                return [...filterPath, ...keyPath.reverse()];
              });
            }}
          >
            Pin
          </NodeAction>
        </Label>
      );
    },
    [setFilterPath]
  );

  const rootItem = (object: any, path: (string | number)[]) => {
    if (!object) return undefined;
    let returnItem = object;
    path.forEach((key) => {
      if (!returnItem || !returnItem[key]) {
        returnItem = undefined;
      } else {
        returnItem = returnItem[key];
      }
    });
    return returnItem;
  };

  const getItemStringLocal = useCallback((type: string, data: any) => {
    return getItemString(type, data, undefined, true, false);
  }, []);

  console.log("keyPath", filterPath);

  return (
    <>
      {props.isOpen ? (
        <Popup>
          <Header>
            <div>StoreActions</div>
            <Menu>
              <MenuItem
                onClick={() => {
                  loggerState.actionHistory = [];
                  setCurrent(undefined);
                  setVersion(Math.random());
                }}
              >
                Clear
              </MenuItem>
              <MenuItem
                onClick={async () => {
                  await localforage.setItem(
                    "@@integratedLogger/savedState",
                    props.store.getState()
                  );
                  alert("saved");
                }}
              >
                Save
              </MenuItem>
              <MenuItem
                onClick={() => {
                  localforage
                    .getItem("@@integratedLogger/savedState")
                    .then((data) => {
                      props.store.dispatch({
                        type: "@@integratedLogger/setstore",
                        payload: data,
                      });
                    });
                }}
              >
                Load
              </MenuItem>
              <MenuItem style={{ marginLeft: "32px" }} onClick={props.onClose}>
                Close
              </MenuItem>
            </Menu>
          </Header>
          <Filter>
            {filterPath.map((p, index) => (
              <div
                className={"path-item"}
                onClick={() => {
                  setFilterPath(filterPath.slice(0, index + 1));
                }}
              >
                {p}
              </div>
            ))}
            {filterPath.length > 0 ? (
              <Clear
                onClick={() => {
                  setFilterPath([]);
                }}
              >
                Reset
              </Clear>
            ) : null}
          </Filter>
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <ActionPanel ref={actionList}>
              {history
                .filter((item) => {
                  console.log(
                    item.action.type,
                    item.diff && rootItem(item.diff, filterPath)
                  );
                  return (
                    filterPath.length === 0 ||
                    rootItem(item.diff, filterPath) !== undefined
                  );
                })
                .map((item, index) => {
                  return (
                    <ActionItem
                      key={index}
                      selected={current === item}
                      onClick={() => {
                        setCurrent(item);
                      }}
                    >
                      <strong>{item.action.type}</strong>
                      {item === current ? (
                        <>
                          <br />
                          {item.time.toISOString()} [reducer{" "}
                          {item.reducerComputeTime}
                          ms] [diff {item.diffComputeTime}
                          ms]
                        </>
                      ) : null}
                      {current ? (
                        <DiffTime>
                          {item.time.getTime() - current.time.getTime()}ms
                        </DiffTime>
                      ) : null}{" "}
                    </ActionItem>
                  );
                })}
            </ActionPanel>
            <ActionDetail>
              {current ? (
                <>
                  <Tabs>
                    <div
                      className={tab === "diff" ? "selected" : ""}
                      onClick={() => setTab("diff")}
                    >
                      Diff
                    </div>
                    <div
                      className={tab === "action" ? "selected" : ""}
                      onClick={() => setTab("action")}
                    >
                      Action
                    </div>
                    <div
                      className={tab === "state" ? "selected" : ""}
                      onClick={() => setTab("state")}
                    >
                      State
                    </div>
                  </Tabs>
                  <Scroll>
                    {tab === "diff" ? (
                      <>
                        <JSONDiff
                          theme={base16Theme}
                          delta={rootItem(current.diff, filterPath)}
                          collectionLimit={10}
                          labelRenderer={renderLabel}
                          isWideLayout={true}
                          dataTypeKey={undefined}
                        />
                      </>
                    ) : null}
                    {tab === "action" ? (
                      <JSONTree
                        theme={base16Theme}
                        data={current.action}
                        collectionLimit={10}
                        getItemString={getItemStringLocal}
                        shouldExpandNode={(keyPath, data, level) => {
                          return !Array.isArray(data) || data.length < 10
                            ? true
                            : false;
                        }}
                      />
                    ) : null}
                    {tab === "state" ? (
                      <JSONTree
                        theme={base16Theme}
                        labelRenderer={renderLabel}
                        getItemString={getItemStringLocal}
                        collectionLimit={10}
                        hideRoot
                        data={rootItem(current.stateAfter, filterPath)}
                      />
                    ) : null}
                  </Scroll>
                </>
              ) : null}
            </ActionDetail>
          </div>
        </Popup>
      ) : null}
    </>
  );
};
