import React, { useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { CustomNode } from '@/types/flow';
import { useFlowStore } from '@/stores/flowStore';

export const BaseNode: React.FC<NodeProps<CustomNode['data']>> = ({ data, selected, id }) => {
  const { selectNode, selectedNodeId } = useFlowStore();
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);

  // Check if this node was just created and selected
  useEffect(() => {
    if (selected && selectedNodeId === id) {
      setIsNewlyCreated(true);
      // Remove the highlight after animation
      const timer = setTimeout(() => setIsNewlyCreated(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [selected, selectedNodeId, id]);
  
  return (
    <div 
      className={`custom-node min-w-[120px] ${selected ? 'selected' : ''} ${isNewlyCreated ? 'newly-created' : ''}`}
      onClick={() => selectNode(id)}
    >
      <div className="text-center p-2">
        <div className="font-medium text-sm">{data.label}</div>
        {data.description && (
          <div className="text-xs text-gray-500 mt-1">{data.description}</div>
        )}
      </div>
      
      {/* Handles for connections */}
      {data.type !== 'start' && (
        <Handle 
          type="target" 
          position={Position.Top}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      )}
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  );
};