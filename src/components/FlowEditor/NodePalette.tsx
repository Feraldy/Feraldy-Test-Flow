import React from 'react';
import { useDrag } from 'react-dnd';
import { NODE_CONFIG } from '@/constants/nodeTypes';
import * as Icons from 'lucide-react';

interface DraggableNodeProps {
  nodeType: string;
}

export const DraggableNode: React.FC<DraggableNodeProps> = ({ nodeType }) => {
  const config = NODE_CONFIG[nodeType as keyof typeof NODE_CONFIG];
  const IconComponent = config?.icon ? (Icons as any)[config.icon] || Icons.HelpCircle : Icons.HelpCircle;
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'NODE',
    item: () => {
      console.log('Starting drag for node type:', nodeType);
      return { nodeType };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      console.log('Drag ended for item:', item, 'did drop:', monitor.didDrop());
    },
  }), [nodeType]);

  if (!config) return null;

  return (
    <div
      ref={drag as any}
      className={`palette-node opacity-90 ${isDragging ? 'opacity-50' : ''}`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <IconComponent className="w-6 h-6 text-blue-600" />
      <span className="text-xs font-medium">{config.label}</span>
    </div>
  );
};

export const NodePalette: React.FC = () => {
  const actionNodes = Object.entries(NODE_CONFIG).filter(([_, config]) => config.category === 'action');

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex gap-2">
        {/* Action Nodes Only */}
        {actionNodes.map(([type]) => (
          <DraggableNode key={type} nodeType={type} />
        ))}
      </div>
    </div>
  );
};