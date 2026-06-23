import React, { useState } from 'react';
import { Activity, LayoutTemplate, Code2, AlertCircle, Download, FileJson } from 'lucide-react';
import { generateBpmnFromText } from './services/geminiService';
import { AppStatus, AnalysisState } from './types';
import { MermaidRenderer } from './components/MermaidRenderer';
import { InputPanel } from './components/InputPanel';
import { JsonViewer } from './components/JsonViewer';

const App = () => {
  const [documentText, setDocumentText] = useState('');
  const [viewMode, setViewMode] = useState<'diagram' | 'json'>('diagram');
  
  const [state, setState] = useState<AnalysisState>({
    status: AppStatus.IDLE,
    result: null,
    error: null
  });

  const handleAnalyze = async () => {
    setState({ status: AppStatus.ANALYZING, result: null, error: null });
    
    try {
      const result = await generateBpmnFromText(documentText);
      setState({ status: AppStatus.SUCCESS, result, error: null });
    } catch (err: any) {
      setState({ 
        status: AppStatus.ERROR, 
        result: null, 
        error: err.message || "An unexpected error occurred." 
      });
    }
  };

  const handleDownloadJson = () => {
    if (!state.result) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${state.result.title.replace(/\s+/g, '_')}_bpmn.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans selection:bg-red-500/20">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-lg text-white">
            <Activity size={20} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">
            BPMN Architect AI
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {state.result && (
            <button 
              onClick={handleDownloadJson}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FileJson size={16} />
              Export JSON
            </button>
          )}
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-500 border border-gray-200">
            Gemini Flash 3.0
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Left Panel: Inputs */}
        <section className="w-1/3 min-w-[350px] max-w-[500px] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <InputPanel 
            documentText={documentText}
            setDocumentText={setDocumentText}
            onAnalyze={handleAnalyze}
            isProcessing={state.status === AppStatus.ANALYZING}
          />
        </section>

        {/* Right Panel: Visualization */}
        <section className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
          
          {/* Toolbar */}
          <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50">
            <div className="flex items-center gap-1 bg-gray-200/50 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('diagram')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'diagram' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutTemplate size={16} />
                Diagram
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'json' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Code2 size={16} />
                JSON Data
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative overflow-hidden">
            {state.status === AppStatus.IDLE && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <Activity size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium">Ready to analyze</p>
                <p className="text-sm max-w-md mt-2">Enter your technical requirements on the left to generate a professional BPMN 2.0 diagram.</p>
              </div>
            )}

            {state.status === AppStatus.ERROR && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-8 text-center bg-red-50/30">
                <AlertCircle size={48} className="mb-4" />
                <p className="text-lg font-bold">Analysis Failed</p>
                <p className="text-sm max-w-md mt-2 text-red-700">{state.error}</p>
              </div>
            )}

            {state.status === AppStatus.SUCCESS && state.result && (
              <div className="w-full h-full">
                {viewMode === 'diagram' ? (
                  <MermaidRenderer chart={state.result.mermaidCode} />
                ) : (
                  <JsonViewer data={state.result} />
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;