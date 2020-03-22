import { FrappeDashboard } from "./interfaces";

export type DashboardDataTypes =
  | LinesDashboard
  | SimpleDashboard
  | BarGraph
  | PieChart
  | PercentDashboard
  | ChangeDashboard;

export interface DashboardLayout {
  title: string;
  name: string;
  enabled: boolean;
  priority: "1" | "2" | "3" | "4" | "5";
  dashboards: Array<FrappeDashboard & { width: number; height: number }>;
}

export interface DashboardData {
  dashboardName: string;
  dashboardType: string;
}

export interface LinesDashboard extends DashboardData {
  xlabel: string;
  ylabel: string;
  data: [
    {
      label: string;
      /**
       * The values are in the format: [[x,y], [x,y]]
       */
      values: number | string[][];
      color?: string;
    }
  ];
}

export interface SimpleDashboard extends DashboardData {
  value: string | number;
}

export interface PieChart extends DashboardData {
  data: [
    {
      label: string;
      value: number;
      color?: string;
    }
  ];
}

export interface BarGraph extends DashboardData {
  xlabel: string;
  ylabel: string;
  grouped: boolean;
  group_labels: string[];
  data: [
    {
      label: string;
      value?: number; // if ungrouped
      values?: number[];
      color?: string;
    }
  ];
}

export interface PercentDashboard extends DashboardData {
  value: number;
}

export interface ChangeDashboard extends DashboardData {
  before: {
    label: string;
    value: string | number;
  };
  now: {
    label: string;
    value: string | number;
  };
  change: string;
  positive: boolean; // use this to indicate positive change
}
