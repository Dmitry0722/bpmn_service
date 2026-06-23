import React from 'react';
import { Upload, FileText } from 'lucide-react';

interface InputPanelProps {
  documentText: string;
  setDocumentText: (text: string) => void;
  onAnalyze: () => void;
  isProcessing: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  documentText,
  setDocumentText,
  onAnalyze,
  isProcessing
}) => {
  return (
    <div className="flex flex-col h-full p-6 gap-6">
      
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900">Входные данные</h3>
        <p className="text-sm text-gray-500">Вставьте техническое задание (ТЗ) для генерации BPMN диаграммы.</p>
      </div>

      {/* Main Document Input */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        <div className="flex items-center gap-2 text-red-600 font-semibold text-sm uppercase tracking-wider">
          <FileText size={16} />
          <span>Техническое задание</span>
        </div>
        <textarea
          className="w-full min-h-[800px] flex-1 bg-white border border-gray-200 rounded-xl p-4 text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none font-mono text-sm shadow-inner transition-all"
          placeholder="Вставьте описание процесса, алгоритм работы или требования здесь..."
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
        />
      </div>

      <button
        onClick={onAnalyze}
        disabled={isProcessing || !documentText.trim()}
        className={`
          flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all shadow-lg
          ${isProcessing 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
            : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-500/25 active:scale-[0.98]'}
        `}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Генерация...
          </>
        ) : (
          <>
            <Upload size={22} />
            Создать схему
          </>
        )}
      </button>
    </div>
  );
};