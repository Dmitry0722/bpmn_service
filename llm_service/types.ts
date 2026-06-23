export interface ProcessStep {
  id: string;
  actor: string;
  action: string;
  type: 'start' | 'process' | 'decision' | 'end';
  next?: string;
  condition?: string;
}

export interface BpmnResponse {
  title: string;
  description: string;
  steps: ProcessStep[];
  mermaidCode: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface AnalysisState {
  status: AppStatus;
  result: BpmnResponse | null;
  error: string | null;
}