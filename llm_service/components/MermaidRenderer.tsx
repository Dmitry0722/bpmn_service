import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RefreshCw, ImageDown, FileText } from 'lucide-react';
import { jsPDF } from "jspdf";

interface MermaidRendererProps {
  chart: string;
}

declare global {
  interface Window {
    mermaid: any;
  }
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
        flowchart: { useMaxWidth: false, htmlLabels: true },
        themeVariables: {
            fontSize: '14px',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            primaryColor: '#fee2e2', // red-100
            primaryTextColor: '#7f1d1d', // red-900
            primaryBorderColor: '#ef4444', // red-500
            lineColor: '#525252', // neutral-600
            secondaryColor: '#f3f4f6', // gray-100
            tertiaryColor: '#ffffff',
        }
      });
    }
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current || !window.mermaid) return;

      try {
        setError(null);
        // Unique ID for each render to avoid conflicts
        const id = `mermaid-${Date.now()}`;
        
        // Attempt render
        const { svg } = await window.mermaid.render(id, chart);
        setSvgContent(svg);
      } catch (err: any) {
        console.error('Mermaid Render Error:', err);
        // Log the problematic chart code to console for the user to see
        console.warn('Failing Mermaid Code:', chart);
        setError('Syntax Error in Diagram. Open Console (F12) to see details.');
      }
    };

    renderChart();
  }, [chart]);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));
  const handleReset = () => setScale(1);

  const getCanvasFromSvg = (): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
        if (!containerRef.current) return reject("No container");
        const svgElement = containerRef.current.querySelector('svg');
        if (!svgElement) return reject("No SVG found");

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgSize = svgElement.getBoundingClientRect();
        
        // High resolution factor
        const pixelRatio = 3; 
        canvas.width = svgSize.width * pixelRatio;
        canvas.height = svgSize.height * pixelRatio;

        const img = new Image();
        img.onload = () => {
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas);
            } else {
                reject("Context error");
            }
        };
        img.onerror = reject;
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });
  }

  const handleDownloadPng = async () => {
    try {
        const canvas = await getCanvasFromSvg();
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'bpmn_diagram.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (e) {
        console.error("PNG Download failed", e);
    }
  };

  const handleDownloadPdf = async () => {
    try {
        const canvas = await getCanvasFromSvg();
        const imgData = canvas.toDataURL('image/png');
        
        // Calculate orientation based on aspect ratio
        const orientation = canvas.width > canvas.height ? 'l' : 'p';
        
        // Initialize PDF with point units
        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'pt',
            format: [canvas.width * 0.75, canvas.height * 0.75] // rough conversion px to pt
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * 0.75, canvas.height * 0.75);
        pdf.save("bpmn_diagram.pdf");
    } catch (e) {
        console.error("PDF Download failed", e);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-white rounded-lg overflow-hidden border border-gray-200">
      <div className="absolute top-4 right-4 z-10 flex gap-2 bg-white/90 backdrop-blur p-1.5 rounded-lg border border-gray-200 shadow-sm">
        <button onClick={handleDownloadPdf} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition" title="Download PDF"><FileText size={18} /></button>
        <button onClick={handleDownloadPng} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Download PNG"><ImageDown size={18} /></button>
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        <button onClick={handleZoomOut} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"><ZoomOut size={18} /></button>
        <button onClick={handleReset} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"><RefreshCw size={18} /></button>
        <button onClick={handleZoomIn} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"><ZoomIn size={18} /></button>
      </div>

      <div className="flex-1 overflow-auto p-8 flex items-center justify-center cursor-grab active:cursor-grabbing bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        {error ? (
          <div className="flex flex-col items-center gap-2 max-w-lg text-center">
             <div className="text-red-500 flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg border border-red-100 font-semibold">
                <span>⚠️ {error}</span>
             </div>
             <p className="text-xs text-gray-500">
               Often caused by parentheses inside diagram text. <br/>
               Please try generating again.
             </p>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="transition-transform duration-200 ease-out origin-center"
            style={{ transform: `scale(${scale})` }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
};