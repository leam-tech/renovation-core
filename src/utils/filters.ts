export type DBFilter =
  | {
      [x: string]: DBValue | [DBOperator, DBValue];
    }
  | [[string, DBOperator, DBValue]?];

export type DBOperator =
  | "LIKE"
  | "NOT LIKE"
  | "="
  | "!="
  | "IS"
  | "IN"
  | "NOT IN"
  | "ANCESTORS OF"
  | "NOT ANCESTORS OF"
  | "DESCENDANTS OF"
  | "NOT DESCENDANTS OF"
  | "BETWEEN"
  | ">"
  | "<"
  | ">="
  | "<=";
export type DBValue = DBBasicValues | DBBasicValues[];
export type DBBasicValues = string | number;
