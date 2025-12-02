import React, { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import FlowCanvas from '@/components/FlowEditor/FlowCanvas';
import { TopBar } from '@/components/UI/TopBar';
import { TestPreviewPanel } from '@/components/FlowEditor/TestPreviewPanel';
import { PropertiesPanel } from '@/components/FlowEditor/PropertiesPanel';
import { useFlowStore } from '@/stores/flowStore';

function App() {
  const { importFlow } = useFlowStore();

  // Check for flow parameter in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const flowData = urlParams.get('flow');
    
    if (flowData) {
      try {
        importFlow(flowData);
        console.log('Flow imported from URL parameter');
        
        // Clean up URL to remove the flow parameter
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } catch (error) {
        console.error('Failed to import flow from URL:', error);
        alert('Failed to import flow from share link');
      }
    }
  }, [importFlow]);
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen w-full overflow-hidden bg-gray-50 relative">
        <TopBar />
        <div className="pt-16 h-full">
          <FlowCanvas />
        </div>
        <TestPreviewPanel />
        <PropertiesPanel />
      </div>
    </DndProvider>
  );
}

export default App;
