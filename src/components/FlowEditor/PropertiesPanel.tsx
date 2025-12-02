import React, { useEffect, useRef } from 'react';
import { useFlowStore } from '@/stores/flowStore';

export const PropertiesPanel: React.FC = () => {
  const { nodes, selectedNodeId, updateNode } = useFlowStore();
  const labelInputRef = useRef<HTMLInputElement>(null);
  const actionTypeRef = useRef<HTMLSelectElement>(null);

  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  // Auto-focus the appropriate field when a node is selected
  useEffect(() => {
    if (selectedNodeId) {
      setTimeout(() => {
        if (selectedNode?.type === 'action' && actionTypeRef.current) {
          actionTypeRef.current.focus();
        } else if (labelInputRef.current) {
          labelInputRef.current.focus();
          labelInputRef.current.select();
        }
      }, 100);
    }
  }, [selectedNodeId, selectedNode?.type]);

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      useFlowStore.getState().selectNode(null);
    }
  };

  if (!selectedNode) return null;

  const handleFieldChange = (field: string, value: any) => {
    updateNode(selectedNode.id, { [field]: value });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-96 max-h-[80vh] overflow-y-auto z-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Properties</h3>
          <button
            onClick={() => useFlowStore.getState().selectNode(null)}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

      <div className="space-y-4">
        {/* Action Node Fields - Action Type First */}
        {selectedNode.type === 'action' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                ref={actionTypeRef}
                value={(selectedNode.data as any).actionType || 'click'}
                onChange={(e) => handleFieldChange('actionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="click">Click</option>
                <option value="hover">Hover</option>
                <option value="fill">Fill</option>
                <option value="type">Type</option>
                <option value="navigate">Navigate</option>
              </select>
            </div>
          </>
        )}

        {/* Basic Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            ref={labelInputRef}
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => handleFieldChange('label', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={selectedNode.data.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>

        {/* Continue Action Node Fields */}
        {selectedNode.type === 'action' && (
          <>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CSS Selector
              </label>
              <input
                type="text"
                value={(selectedNode.data as any).selector || ''}
                onChange={(e) => handleFieldChange('selector', e.target.value)}
                placeholder="e.g., #login-button, .email-input"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {((selectedNode.data as any).actionType === 'fill' || (selectedNode.data as any).actionType === 'type') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {(selectedNode.data as any).actionType === 'fill' ? 'Value' : 'Text'}
                </label>
                <input
                  type="text"
                  value={(selectedNode.data as any).value || (selectedNode.data as any).text || ''}
                  onChange={(e) => handleFieldChange((selectedNode.data as any).actionType === 'fill' ? 'value' : 'text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {(selectedNode.data as any).actionType === 'hover' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (ms)
                </label>
                <input
                  type="number"
                  value={(selectedNode.data as any).duration || 1000}
                  onChange={(e) => handleFieldChange('duration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

             {(selectedNode.data as any).actionType === 'navigate' && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   URL (Optional)
                 </label>
                 <input
                   type="text"
                   value={(selectedNode.data as any).url || ''}
                   onChange={(e) => handleFieldChange('url', e.target.value)}
                   placeholder="https://example.com"
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
               </div>
             )}

             {(selectedNode.data as any).actionType === 'click' && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Click Type
                 </label>
                 <select
                   value={(selectedNode.data as any).clickType || 'single'}
                   onChange={(e) => handleFieldChange('clickType', e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="single">Single Click</option>
                   <option value="double">Double Click</option>
                   <option value="right">Right Click</option>
                 </select>
               </div>
             )}

            {/* Expected Results Fields */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Expected Results</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Positive Expected Result
                  </label>
                  <textarea
                    value={(selectedNode.data as any).positiveExpectedResult || ''}
                    onChange={(e) => handleFieldChange('positiveExpectedResult', e.target.value)}
                    placeholder="What should happen when this action succeeds?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Negative Expected Result
                  </label>
                  <textarea
                    value={(selectedNode.data as any).negativeExpectedResult || ''}
                    onChange={(e) => handleFieldChange('negativeExpectedResult', e.target.value)}
                    placeholder="What should happen when this action fails?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </>
        )}




      </div>
    </div>
    </>
  );
};