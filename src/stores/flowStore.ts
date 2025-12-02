import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges, 
  type Connection
} from 'reactflow';
import type { CustomNode, CustomEdge, ValidationState, TestCase, TestStep, ValidationError } from '@/types/flow';
import { NODE_CONFIG } from '@/constants/nodeTypes';

interface FlowStore {
  // State
  nodes: CustomNode[];
  edges: CustomEdge[];
  selectedNodeId: string | null;
  validationState: ValidationState;
  testCases: TestCase[];
  copiedNode: CustomNode | null;
  
  // Undo/Redo
  history: Array<{
    nodes: CustomNode[];
    edges: CustomEdge[];
    selectedNodeId: string | null;
  }>;
  historyIndex: number;
  
  // Actions
  setNodes: (nodes: CustomNode[]) => void;
  setEdges: (edges: CustomEdge[]) => void;
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (connection: Connection) => void;
  
  addNode: (type: string, position: { x: number; y: number }) => string;
  updateNode: (id: string, data: Partial<CustomNode['data']>) => void;
  deleteNode: (id: string) => void;
  
  selectNode: (id: string | null) => void;
  
  setEdgeType: (edgeId: string, type: 'positive' | 'negative') => void;
  
  // Copy/Paste
  copyNode: (id: string) => void;
  pasteNode: (position: { x: number; y: number }) => string;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
  
  // URL Sharing
  exportFlow: () => string;
  importFlow: (flowData: string) => void;
  copyShareLink: () => void;
  
  // Qase Export
  exportToQase: () => any;
  
  validateFlow: () => ValidationState;
  generateTestCases: () => TestCase[];
  
  // Utility
  resetFlow: () => void;
}

const initialState = {
  nodes: [
    {
      id: 'start-1',
      type: 'start' as const,
      position: { x: 100, y: 100 },
      data: {
        ...NODE_CONFIG.start.defaultData,
        id: 'start-1',
        type: 'start',
        errors: [],
      },
    },
  ] as CustomNode[],
  edges: [] as CustomEdge[],
  selectedNodeId: null,
  validationState: {
    isValid: false,
    errors: [],
    warnings: [],
  },
  testCases: [],
  copiedNode: null,
  history: [],
  historyIndex: -1,
};

// Helper functions for Qase export
const extractPreconditions = (testCase: TestCase): string => {
  // Look for navigate steps in the test case
  const navigateSteps = testCase.steps.filter(step => 
    step.options && (step.options as any).actionType === 'navigate'
  );
  
  if (navigateSteps.length > 0) {
    return navigateSteps.map(step => `Navigate to ${(step.options as any).url || 'specified page'}`).join(', ');
  }
  
  return 'Navigate to application';
};

const extractExpectedResult = (step: TestStep): string => {
  // Try to get expected result from step options
  if (step.options) {
    const options = step.options as any;
    // For positive flows, use positive expected result
    if (options.positiveExpectedResult) {
      return options.positiveExpectedResult;
    }
    // For negative flows, use negative expected result
    if (options.negativeExpectedResult) {
      return options.negativeExpectedResult;
    }
  }
  
  // Default expected result based on action type
  const action = step.action.toLowerCase();
  if (action.includes('navigate')) {
    return 'Page loads successfully';
  } else if (action.includes('click')) {
    return 'Element is clickable and action completes';
  } else if (action.includes('fill') || action.includes('type')) {
    return 'Value is entered successfully';
  } else if (action.includes('hover')) {
    return 'Element responds to hover';
  }
  
  return 'Action completes successfully';
};

export const useFlowStore = create<FlowStore>()(
  subscribeWithSelector((set, get) => {
    // Initialize history with initial state
    const initialStateWithHistory = {
      ...initialState,
      history: [{
        nodes: JSON.parse(JSON.stringify(initialState.nodes)),
        edges: JSON.parse(JSON.stringify(initialState.edges)),
        selectedNodeId: initialState.selectedNodeId,
      }],
      historyIndex: 0,
    };

    return {
      ...initialStateWithHistory,
      
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
    
    onNodesChange: (changes) => {
      const { nodes } = get();
      set({ nodes: applyNodeChanges(changes, nodes) as CustomNode[] });
    },
    
    onEdgesChange: (changes) => {
      const { edges } = get();
      set({ edges: applyEdgeChanges(changes, edges) as CustomEdge[] });
    },
    
    onConnect: (connection) => {
      const { edges } = get();
      const newEdge: CustomEdge = {
        id: `${connection.source}-${connection.target}`,
        source: connection.source!,
        target: connection.target!,
        type: 'positive',
      };
      set({ edges: addEdge(newEdge, edges) as CustomEdge[] });
      
      // Save to history after connecting nodes
      get().saveToHistory();
    },
    
    addNode: (type, position) => {
      const { nodes } = get();
      const config = NODE_CONFIG[type as keyof typeof NODE_CONFIG];
      if (!config) return '';
      
      const nodeId = `${type}-${Date.now()}`;
      const newNode: CustomNode = {
        id: nodeId,
        type: type as any,
        position,
        data: {
          ...config.defaultData,
          id: nodeId,
          type: type as any,
          errors: [],
        },
      };
      
      set({ 
        nodes: [...nodes, newNode],
        selectedNodeId: nodeId // Auto-select the newly created node
      });
      
      // Save to history after adding node
      get().saveToHistory();
      
      return nodeId;
    },
    
    updateNode: (id, data) => {
      const { nodes } = get();
      set({
        nodes: nodes.map(node =>
          node.id === id
            ? { ...node, data: { ...node.data, ...data } }
            : node
        ),
      });
      
      // Save to history after updating node
      get().saveToHistory();
    },
    
    deleteNode: (id) => {
      const { nodes, edges } = get();
      set({
        nodes: nodes.filter(node => node.id !== id),
        edges: edges.filter(edge => edge.source !== id && edge.target !== id),
        selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
      });
      
      // Save to history after deleting node
      get().saveToHistory();
    },
    
    selectNode: (id) => set({ selectedNodeId: id }),
    
    copyNode: (id) => {
      const { nodes } = get();
      const nodeToCopy = nodes.find(node => node.id === id);
      if (nodeToCopy) {
        set({ copiedNode: nodeToCopy });
      }
    },
    
    pasteNode: (position) => {
      const { copiedNode, nodes } = get();
      if (!copiedNode) return '';
      
      const newNodeId = `${copiedNode.type}-${Date.now()}`;
      const newNode: CustomNode = {
        ...copiedNode,
        id: newNodeId,
        position: {
          x: position.x + 50, // Offset to avoid overlap
          y: position.y + 50,
        },
        data: {
          ...copiedNode.data,
          id: newNodeId,
        },
      };
      
      set({
        nodes: [...nodes, newNode],
        selectedNodeId: newNodeId, // Auto-select the pasted node
      });
      
      // Save to history after paste
      get().saveToHistory();
      
      return newNodeId;
    },
    
    // Undo/Redo functions
    saveToHistory: () => {
      const { nodes, edges, selectedNodeId, history, historyIndex } = get();
      
      // Create a deep copy of current state
      const currentState = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        selectedNodeId,
      };
      
      // If we're not at the end of history, truncate future states
      const newHistory = history.slice(0, historyIndex + 1);
      
      // Add current state to history
      newHistory.push(currentState);
      
      // Keep only last 10 states
      if (newHistory.length > 10) {
        newHistory.shift();
      }
      
      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },
    
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex <= 0) return;
      
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      
      set({
        nodes: previousState.nodes,
        edges: previousState.edges,
        selectedNodeId: previousState.selectedNodeId,
        historyIndex: newIndex,
      });
    },
    
    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= history.length - 1) return;
      
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      
      set({
        nodes: nextState.nodes,
        edges: nextState.edges,
        selectedNodeId: nextState.selectedNodeId,
        historyIndex: newIndex,
      });
    },
    
    canUndo: () => {
      const { historyIndex } = get();
      return historyIndex > 0;
    },
    
    canRedo: () => {
      const { history, historyIndex } = get();
      return historyIndex < history.length - 1;
    },
    
    // URL Sharing functions
    exportFlow: () => {
      const { nodes, edges } = get();
      const flowData = {
        nodes,
        edges,
        exportedAt: new Date().toISOString(),
      };
      
      // Convert to JSON and then base64
      const jsonString = JSON.stringify(flowData);
      return btoa(jsonString);
    },
    
    importFlow: (flowData) => {
      try {
        // Decode from base64 and parse JSON
        const jsonString = atob(flowData);
        const importedData = JSON.parse(jsonString);
        
        if (importedData.nodes && importedData.edges) {
          set({
            nodes: importedData.nodes,
            edges: importedData.edges,
            selectedNodeId: null,
          });
          
          // Save to history after import
          get().saveToHistory();
          
          return true;
        } else {
          throw new Error('Invalid flow data structure');
        }
      } catch (error) {
        console.error('Failed to import flow:', error);
        throw new Error('Invalid share link format');
      }
    },
    
    copyShareLink: () => {
      try {
        const flowData = get().exportFlow();
        const currentUrl = window.location.origin + window.location.pathname;
        const shareLink = `${currentUrl}?flow=${encodeURIComponent(flowData)}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareLink).then(() => {
          console.log('Share link copied to clipboard');
        }).catch((error) => {
          console.error('Failed to copy share link:', error);
          // Fallback: create temporary input element
          const input = document.createElement('input');
          input.value = shareLink;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
        });
      } catch (error) {
        console.error('Failed to create share link:', error);
        throw new Error('Failed to create share link');
      }
    },
    
    exportToQase: () => {
      const { testCases } = get();
      
      // Transform test cases to Qase.io format
      const qaseExport = {
        cases: testCases.map((testCase) => ({
          title: testCase.name,
          description: testCase.description || '',
          preconditions: extractPreconditions(testCase),
          suite_title: "Fill in your Qase project name",
          priority: "medium",
          steps: testCase.steps.map((step) => ({
            action: `${step.action}${step.target ? ` on ${step.target}` : ''}${step.value ? ` with value "${step.value}"` : ''}`,
            expected_result: extractExpectedResult(step),
          })),
        })),
      };
      
      return qaseExport;
    },
    
    setEdgeType: (edgeId, type) => {
      const { edges } = get();
      set({
        edges: edges.map(edge =>
          edge.id === edgeId ? { ...edge, type } : edge
        ),
      });
      
      // Save to history after changing edge type
      get().saveToHistory();
    },
    
    validateFlow: () => {
      const { nodes } = get();
      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];
      
      // Check for start node
      const startNodes = nodes.filter(node => node.type === 'start');
      if (startNodes.length === 0) {
        errors.push({
          nodeId: 'flow',
          field: 'start',
          message: 'Flow must have a start node',
          severity: 'error' as const,
        });
      }
      
      // Validate each node
      nodes.forEach(node => {
        const nodeErrors = [];
        
        if (node.type === 'action') {
          const actionType = (node.data as any).actionType;
          
          // Check selector requirement for interactive actions
          if (actionType === 'click' || actionType === 'fill' || actionType === 'hover' || actionType === 'type') {
            if (!(node.data as any).selector) {
              nodeErrors.push({
                nodeId: node.id,
                field: 'selector',
                message: 'Selector is required',
                severity: 'error' as const,
              });
            }
          }
          
          // Check value requirement for input actions
          if (actionType === 'fill' || actionType === 'type') {
            if (!(node.data as any).value && !(node.data as any).text) {
              nodeErrors.push({
                nodeId: node.id,
                field: 'value',
                message: 'Value/text is required',
                severity: 'error' as const,
              });
            }
          }
        }
        

        
        errors.push(...nodeErrors);
      });
      
      const validationState: ValidationState = {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
      
      set({ validationState });
      return validationState;
    },
    
    generateTestCases: () => {
      const { nodes, edges } = get();
      const testCases: TestCase[] = [];
      
      // Find start node
      const startNode = nodes.find(node => node.type === 'start');
      if (!startNode) return testCases;
      
      // Build adjacency list
      const adjacencyList: Record<string, Array<{ node: CustomNode; edge: CustomEdge }>> = {};
      
      edges.forEach(edge => {
        const targetNode = nodes.find(node => node.id === edge.target);
        if (targetNode) {
          if (!adjacencyList[edge.source]) {
            adjacencyList[edge.source] = [];
          }
          adjacencyList[edge.source].push({ node: targetNode, edge });
        }
      });
      
      // Generate unique paths with proper stopping logic
      const generateUniquePaths = (startNode: CustomNode): CustomNode[][] => {
        const uniquePaths: CustomNode[][] = [];
        
        const explorePaths = (currentNode: CustomNode, currentPath: CustomNode[], visited: Set<string>, isNegativePath: boolean) => {
          const newPath = [...currentPath, currentNode];
          
          // Get outgoing edges
          const outgoingEdges = adjacencyList[currentNode.id] || [];
          
          // Check if current node is a decision point (has negativeExpectedResult)
          const isDecisionPoint = currentNode.type === 'action' && (currentNode.data as any).negativeExpectedResult;
          
          // Apply stopping logic for negative paths
          if (isDecisionPoint && isNegativePath) {
            // For negative paths, stop at the decision point
            uniquePaths.push(newPath);
            return;
          }
          
          // If it's an end node, save the complete path
          if (outgoingEdges.length === 0) {
            uniquePaths.push(newPath);
            return;
          }
          
          // Continue exploring all outgoing edges
          outgoingEdges.forEach(({ node: nextNode, edge }) => {
            if (!visited.has(nextNode.id)) {
              visited.add(nextNode.id);
              
              // Determine if the next path will be negative
              const nextIsNegative = isNegativePath || edge.type === 'negative';
              
              explorePaths(nextNode, newPath, new Set(visited), nextIsNegative);
            }
          });
        };
        
        explorePaths(startNode, [], new Set(), false);
        return uniquePaths;
      };
      
      // Generate test cases from unique paths
      const generateTestCasesFromPaths = (paths: CustomNode[][]) => {
        return paths.map((path, index) => {
          // Filter out start node and create test steps
          const testCaseSteps = path
            .filter(node => node.type !== 'start')
            .map((node, stepIndex) => ({
              id: node.id,
              action: node.data.label,
              target: (node.data as any).selector,
              value: (node.data as any).value || (node.data as any).text || (node.data as any).url,
              options: node.data,
              order: stepIndex,
            }));
          
          // Determine if this is a negative test case by checking for negative edges
          const hasNegativeEdge = path.some((node, nodeIndex) => {
            if (nodeIndex === 0) return false; // Skip start node
            const edge = edges.find(e => 
              e.source === path[nodeIndex - 1].id && e.target === node.id
            );
            return edge?.type === 'negative';
          });
          
          // Find the last node to determine expected result
          const lastNode = path[path.length - 1];
          const isNegativeTest = hasNegativeEdge && lastNode.type === 'action' && (lastNode.data as any).negativeExpectedResult;
          
          const expectedResult = isNegativeTest 
            ? (lastNode.data as any).negativeExpectedResult
            : (() => {
                // Find the first node with positiveExpectedResult for positive tests
                const positiveResultNode = path.find(node => 
                  node.type === 'action' && (node.data as any).positiveExpectedResult
                );
                return (positiveResultNode?.data as any)?.positiveExpectedResult || '';
              })();
          
          return {
            id: `test-${index + 1}`,
            name: isNegativeTest ? `Test Case ${index + 1} (Negative)` : `Test Case ${index + 1}`,
            description: `Flow from ${lastNode?.data.label || 'end'}${expectedResult ? ' - Expected: ' + expectedResult : ''}`,
            steps: testCaseSteps
          };
        });
      };
      
      // Generate unique paths and create test cases
      const uniquePaths = generateUniquePaths(startNode);
      const generatedTestCases = generateTestCasesFromPaths(uniquePaths);
      
      set({ testCases: generatedTestCases });
      return generatedTestCases;
    },
    
    resetFlow: () => {
      set({
        ...initialState,
        history: [{
          nodes: JSON.parse(JSON.stringify(initialState.nodes)),
          edges: JSON.parse(JSON.stringify(initialState.edges)),
          selectedNodeId: initialState.selectedNodeId,
        }],
        historyIndex: 0,
      });
    },
  };
}))
