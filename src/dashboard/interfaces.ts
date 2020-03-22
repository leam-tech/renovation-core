export interface FrappeDashboard {
  name: string;
  enable: string;
  title: string;
  subtitle: string;
  is_standard: "Yes" | "No";
  type: "lines" | "bar" | "pie" | "percent" | "change" | "simple";
  exc_type: "eval" | "cmd";
  cmd?: string;
  eval_code?: string;
  params?: FrappeDashboardParams[];
}

export interface FrappeDashboardParams {
  param: string;
  type: "Select" | "Number" | "Text" | "Check" | "Radio" | "Date";
  options?: string;
  default_value?: any;
  label: string;
  reqd: boolean;
  value?: unknown;
}

export interface GetDashboardMetaParams {
  dashboardName: string;
}

export interface GetDashboardDataParams {
  dashboardName: string;
  params?: FrappeDashboardParams[];
}


export interface RefreshDataParams {
  dashboardName?: string;
}

export interface GetDashboardLayoutParams {
  layout?: string;
}
