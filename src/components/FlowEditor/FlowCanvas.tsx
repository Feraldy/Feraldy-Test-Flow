import React, { useCallback, useRef, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  type Connection,
  type Edge
} from 'reactflow';
import { useDrop } from 'react-dnd';
import { useFlowStore } from '@/stores/flowStore';
import { nodeTypes } from '@/components/Nodes';
import { NodePalette } from './NodePalette';
import 'reactflow/dist/style.css';

const FlowCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectedNodeId,
    setEdgeType,
    copyNode,
    pasteNode,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useFlowStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);

  // React DnD drop handler
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'NODE',
    drop: (item: { nodeType: string }, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset || !reactFlowWrapper.current || !reactFlowInstance) return;


      
      // Convert screen coordinates to ReactFlow coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: offset.x,
        y: offset.y,
      });

      console.log('Dropping node via React DnD:', item.nodeType, 'at position:', position);
      const newNodeId = addNode(item.nodeType, position);
      console.log('Created and selected new node:', newNodeId);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [reactFlowInstance, addNode]);

  const onConnectCallback = useCallback(
    (params: Connection) => {
      console.log('Connecting nodes:', params);
      onConnect(params);
    },
    [onConnect]
  );

  // Simplified drag over for ReactFlow compatibility
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      const newType = edge.type === 'positive' ? 'negative' : 'positive';
      setEdgeType(edge.id, newType);
    },
    [setEdgeType]
  );

  // Keyboard event handlers for copy/paste
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            event.preventDefault();
            if (canUndo()) {
              undo();
              console.log('Undo action');
            }
            break;
          case 'y':
            event.preventDefault();
            if (canRedo()) {
              redo();
              console.log('Redo action');
            }
            break;
          case 'c':
            event.preventDefault();
            if (selectedNodeId) {
              copyNode(selectedNodeId);
              console.log('Copied node:', selectedNodeId);
            }
            break;
          case 'v':
            event.preventDefault();
            if (reactFlowInstance && reactFlowWrapper.current) {
              // Get center of viewport as paste position
              const viewport = reactFlowInstance.getViewport();
              const position = {
                x: -viewport.x + viewport.width / 2,
                y: -viewport.y + viewport.height / 2,
              };
              const newNodeId = pasteNode(position);
              console.log('Pasted node at position:', position, 'New ID:', newNodeId);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, copyNode, pasteNode, undo, redo, canUndo, canRedo, reactFlowInstance, reactFlowWrapper]);

  return (
    <div className="w-full h-screen relative" ref={reactFlowWrapper}>
      <div 
        ref={drop as any} 
        className={`w-full h-full ${isOver ? 'bg-blue-50' : ''}`}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <ReactFlow
            nodes={nodes}
            edges={edges.map(edge => ({
              ...edge,
              style: {
                ...edge.style,
                stroke: edge.type === 'negative' ? '#ef4444' : '#10b981',
                strokeWidth: 2,
                strokeDasharray: edge.type === 'negative' ? '5,5' : undefined,
              },
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnectCallback}
            onInit={setReactFlowInstance}
            onDragOver={onDragOver}
            onEdgeContextMenu={onEdgeContextMenu}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Background color="#aaa" gap={16} />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'start': return '#10b981';
                  default: return '#3b82f6';
                }
              }}
              className="bg-white border border-gray-200"
            />
          </ReactFlow>
        </div>
        
        <NodePalette />
      </div>
  );
};

export default FlowCanvas;