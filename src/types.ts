export type DecisionCategory = 'Tech Stack' | 'Career Move' | 'Major Purchase' | 'Hiring' | 'Custom';

export interface DynamicParameter {
  id: string;
  name: string;
  label: string;
  type: 'slider' | 'toggle' | 'select' | 'text';
  value: any;
  options?: string[]; // For select types
  min?: number;
  max?: number;
  unit?: string;
  reason: string; // AI explanation for why this parameter matters
}

export interface ComparisonOption {
  name: string;
  overview: string;
  pros: string[];
  cons: string[];
  best_for: string;
  risks: string[];
  cost_level: 'Low' | 'Medium' | 'High';
  complexity: 'Low' | 'Medium' | 'High';
  scores: {
    suitability: number; // 0-100
    risk: number; // 0-100
    cost: number; // 0-100
    scalability: number; // 0-100
  };
}

export interface ComparisonResponse {
  options: ComparisonOption[];
  summary: string;
  recommendation: string;
}

export interface UserPreferences {
  category: DecisionCategory;
  problemStatement: string;
  dynamicParams: DynamicParameter[];
  priorities: string[];
}

export enum AppStep {
  LANDING = 0,
  INTENT = 1,
  CONFIGURING = 2,
  LOADING = 3,
  RESULTS = 4,
}
