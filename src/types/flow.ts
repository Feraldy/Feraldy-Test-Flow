// Node Types
export type NodeType = 
  | 'start' | 'action';

// Action Types
export type ActionType = 'click' | 'hover' | 'fill' | 'type' | 'navigate';

// Edge Types
export type EdgeType = 'positive' | 'negative';

// Base Node Data
export interface BaseNodeData {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  isValid: boolean;
  errors: ValidationError[];
}

// Action Node Data
export interface ActionNodeData extends BaseNodeData {
  actionType: ActionType;
  selector?: string;
  waitFor?: number;
  optional?: boolean;
  // Click specific
  clickType?: 'single' | 'double' | 'right';
  position?: { x: number; y: number };
  // Fill specific
  value?: string;
  validate?: string; // regex pattern
  // Hover specific
  duration?: number;
  moveTo?: { x: number; y: number };
  // Type specific
  text?: string;
  delay?: number;
  // Navigate specific
  url?: string;
  // Expected Results
  positiveExpectedResult?: string;
  negativeExpectedResult?: string;
}

export interface StartNodeData extends BaseNodeData {
  testName: string;
  description?: string;
}

// Union type for all node data
export type NodeData = 
  | StartNodeData
  | ActionNodeData;

// ReactFlow Extensions
export interface CustomNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface CustomEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  animated?: boolean;
  style?: React.CSSProperties;
}

// Validation
export interface ValidationError {
  nodeId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Test Case Generation
export interface TestStep {
  id: string;
  action: string;
  target?: string;
  value?: string;
  options?: Record<string, any>;
  order: number;
}

export interface TestCase {
  id: string;
  name: string;
  description?: string;
  steps: TestStep[];
}

// Node Configuration
export interface NodeConfig {
  type: NodeType;
  label: string;
  icon?: string;
  description: string;
  category: 'action' | 'control';
  defaultData: Partial<NodeData>;
}