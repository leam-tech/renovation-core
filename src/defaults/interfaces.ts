export interface GetDefaultParams {
  key: string;
  parent?: string;
}

export interface SetDefaultParams {
  key: string;
  value: DefaultValueTypes;
  parent?: string;
}

export type DefaultValueTypes = string | object | boolean | number;
