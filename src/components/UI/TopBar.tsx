import React, { useState, useRef, useEffect } from 'react';
import { useFlowStore } from '@/stores/flowStore';

export const TopBar: React.FC = () => {
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { validateFlow, generateTestCases, testCases, resetFlow, selectedNodeId, copyNode, pasteNode, undo, redo, canUndo, canRedo, copyShareLink, importFlow, exportToQase } = useFlowStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleValidate = () => {
    const validation = validateFlow();
    if (validation.isValid) {
      alert('Flow is valid!');
    } else {
      alert(`Flow has ${validation.errors.length} errors`);
    }
  };

  const handleGenerate = () => {
    const cases = generateTestCases();
    alert(`Generated ${cases.length} test cases`);
  };

  const handleShareLink = () => {
    try {
      copyShareLink();
      alert('Share link copied to clipboard!');
    } catch (error) {
      alert('Failed to create share link');
    }
  };

  const handleImportFromUrl = () => {
    const url = prompt('Enter share link:');
    if (url) {
      try {
        const urlParams = new URLSearchParams(url.split('?')[1] || '');
        const flowData = urlParams.get('flow');
        if (flowData) {
          importFlow(flowData);
          alert('Flow imported successfully!');
        } else {
          alert('Invalid share link');
        }
      } catch (error) {
        alert('Failed to import flow: ' + (error as Error).message);
      }
    }
  };

  const handleExportQase = () => {
    try {
      const qaseData = exportToQase();
      
      const blob = new Blob([JSON.stringify(qaseData, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test-cases-qase-export.json';
      a.click();
      URL.revokeObjectURL(url);
      
      alert('Qase.io export downloaded successfully!');
    } catch (error) {
      alert('Failed to export to Qase.io format');
    }
  };

  const handleExport = () => {
    const { nodes, edges } = useFlowStore.getState();
    const exportData = {
      nodes,
      edges,
      testCases,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-flow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900">Test Case Generator</h1>
        <div className="text-sm text-gray-500">
          {testCases.length} test case{testCases.length !== 1 ? 's' : ''} generated
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={handleValidate}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Validate Flow
        </button>
        
        <button
          onClick={handleGenerate}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Generate Tests
        </button>
        
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
        
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          ↷ Redo
        </button>
        
        <button
          onClick={() => selectedNodeId && copyNode(selectedNodeId)}
          disabled={!selectedNodeId}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Copy Node (Ctrl+C)"
        >
          Copy
        </button>
        
        <button
          onClick={() => {
            // Paste at center of viewport
            const position = { x: 400, y: 300 }; // Default center position
            pasteNode(position);
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          title="Paste Node (Ctrl+V)"
        >
          Paste
        </button>
        
        <button
          onClick={handleShareLink}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          title="Copy Share Link"
        >
          Share Link
        </button>
        
        <button
          onClick={handleImportFromUrl}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          title="Import from URL"
        >
          Import
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Export ▼
          </button>
          
          {/* Dropdown Menu */}
          {isExportDropdownOpen && (
            <div className="absolute top-full mt-1 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50">
              <button
                onClick={handleExport}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                Export Flow (JSON)
              </button>
              <button
                onClick={handleExportQase}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                Export to Qase.io
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={resetFlow}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
};