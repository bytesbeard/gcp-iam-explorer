
export enum NodeType {
  ORGANIZATION = 'ORGANIZATION',
  FOLDER = 'FOLDER',
  PROJECT = 'PROJECT',
  RESOURCE = 'RESOURCE',
  USER = 'USER',
  GROUP = 'GROUP',
  SERVICE_ACCOUNT = 'SERVICE_ACCOUNT'
}

export interface IAMCondition {
  title: string;
  expression: string;
  description?: string;
}

export interface IAMBinding {
  role: string;
  members: string[];
  condition?: IAMCondition;
}

export interface IAMPolicy {
  bindings: IAMBinding[];
  version: number;
}

export interface IAMNode {
  id: string;
  name: string;
  type: NodeType;
  parentId?: string;
  depth?: number; // Used for hierarchical layout
  x?: number;
  y?: number;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  initialNodes: IAMNode[];
  initialPolicy: Record<string, IAMPolicy>;
  actionLabel: string;
  actionDescription: string;
  denyPolicy?: boolean; // If true, demonstrates a Deny policy
}

export interface SimulationState {
  activeScenarioId: string;
  isActionApplied: boolean;
  selectedNodeId: string | null;
}
