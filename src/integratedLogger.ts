/* eslint-disable */
import { create } from "jsondiffpatch";

const jsondiffpatch = create({});

export interface LogItem {
  time: Date;
  timeSinceLast: number;
  diffComputeTime: number;
  diff: any;
  action: any;
}

let lastActionTime: Date | undefined = undefined;

export interface LoggerState {
  actionHistory: LogItem[];
}

export const loggerState: LoggerState = {
  actionHistory: [],
};

export const reducerWrapper = (originalReducer: any) => {
  return (state: any, action: any) => {
    if (action.type === "@@integratedLogger/setstore") {
      return action.payload;
    } else {
      return originalReducer(state, action);
    }
  };
};

export const fastLoggerMiddleware =
  (store: any) => (next: any) => (action: any) => {
    const newTime = new Date();
    const beforeState = store.getState();
    const logitem: any = {
      time: newTime,
      diff: undefined,
      diffComputeTime: undefined,
      stateAfter: undefined,
      timeSinceLast:
        newTime && lastActionTime
          ? newTime.getTime() - lastActionTime.getTime()
          : 0,
      action: action,
    };
    loggerState.actionHistory.push(logitem);
    lastActionTime = newTime;

    const returned = next(action);

    const afterState = store.getState();
    logitem.stateAfter = afterState;
    const startCompution = new Date();
    logitem.diff = jsondiffpatch.diff(beforeState, afterState);

    logitem.diffComputeTime = new Date().getTime() - startCompution.getTime();

    return returned;
  };
