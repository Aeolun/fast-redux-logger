import { getText, IS_IMMUTABLE_KEY } from "./utils";
import React from "react";
import { base16Theme } from "./base16theme";

export const getItemString = (
  type: string,
  data: any,
  dataTypeKey: string | symbol | undefined,
  isWideLayout: boolean,
  isDiff?: boolean
) => (
  <span
    style={{
      color: base16Theme.base04,
    }}
  >
    {data[IS_IMMUTABLE_KEY] ? "Immutable" : ""}
    {dataTypeKey && data[dataTypeKey] ? `${data[dataTypeKey] as string} ` : ""}
    {getText(type, data, isWideLayout, isDiff)}
  </span>
);
