import { BaseNode } from './BaseNode';

// Export all node types - defined outside component to prevent recreation on every render
export const nodeTypes = {
  start: BaseNode,
  action: BaseNode,
};

export { BaseNode };