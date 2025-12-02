import React from 'react';
import { useFlowStore } from '@/stores/flowStore';

export const TestPreviewPanel: React.FC = () => {
  const { testCases, selectedNodeId } = useFlowStore();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-20 z-40 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium">Test Preview ({testCases.length})</span>
        </div>
      </button>

      {/* Slide-out Panel */}
      <div
        className={`fixed right-0 top-16 h-full w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 z-30 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Generated Test Cases</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {testCases.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="mb-4">📝</div>
                <p>No test cases generated yet</p>
                <p className="text-sm mt-2">Create a flow and click "Generate Tests"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testCases.map((testCase, index) => (
                  <div key={testCase.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{testCase.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {testCase.steps.length} steps
                      </span>
                    </div>
                    
                    {testCase.description && (
                      <p className="text-sm text-gray-600 mb-3">{testCase.description}</p>
                    )}
                    
                    <div className="space-y-2">
                      {testCase.steps.map((step, stepIndex) => (
                        <div key={step.id} className="flex items-start gap-3 text-sm">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                            {stepIndex + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 capitalize">
                              {step.action}
                            </div>
                            {step.target && (
                              <div className="text-gray-600">
                                Target: <code className="bg-gray-100 px-1 rounded">{step.target}</code>
                              </div>
                            )}
                            {step.value && (
                              <div className="text-gray-600">
                                Value: <code className="bg-gray-100 px-1 rounded">{step.value}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};