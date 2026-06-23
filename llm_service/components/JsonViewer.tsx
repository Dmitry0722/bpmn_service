import React from 'react';
import { BpmnResponse } from '../types';

interface JsonViewerProps {
  data: BpmnResponse;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 h-full overflow-auto font-mono text-xs text-gray-700">
      <pre className="whitespace-pre-wrap break-all">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};