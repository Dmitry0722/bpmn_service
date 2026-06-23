import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import styles from './SchemaViewer.module.css';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'monospace',
  flowchart: {
    htmlLabels: false
  }
});

const SchemaViewer = ({ schema }) => {
  const [viewMode, setViewMode] = useState('diagram');
  const [renderError, setRenderError] = useState('');
  const [renderedSvg, setRenderedSvg] = useState('');
  const diagramRef = useRef(null);

  const handleDownloadPng = async () => {
    try {
      if (!diagramRef.current) return;

      const svgElement = diagramRef.current.querySelector('svg');
      if (!svgElement) {
        setRenderError('Диаграмма еще не готова для скачивания');
        return;
      }

      const serializer = new XMLSerializer();
      const svgText = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        try {
          const viewBox = svgElement.viewBox?.baseVal;
          const width = Math.max(
            Math.ceil(viewBox?.width || 0),
            Math.ceil(svgElement.getBoundingClientRect().width),
            1200
          );
          const height = Math.max(
            Math.ceil(viewBox?.height || 0),
            Math.ceil(svgElement.getBoundingClientRect().height),
            600
          );

          const scale = 2;
          const canvas = document.createElement('canvas');
          canvas.width = width * scale;
          canvas.height = height * scale;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(blobUrl);
            setRenderError('Не удалось подготовить PNG');
            return;
          }

          ctx.scale(scale, scale);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(image, 0, 0, width, height);

          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `diagram-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        } catch (canvasError) {
          URL.revokeObjectURL(blobUrl);
          console.error('PNG export canvas error:', canvasError);
          setRenderError('Браузер заблокировал экспорт PNG для этой диаграммы');
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        setRenderError('Не удалось экспортировать диаграмму в PNG');
      };

      image.src = blobUrl;
    } catch (error) {
      console.error('PNG export error:', error);
      setRenderError('Ошибка при скачивании PNG');
    }
  };

  useEffect(() => {
    if (!schema || viewMode !== 'diagram' || !diagramRef.current) {
      return;
    }

    let cancelled = false;

    const renderDiagram = async () => {
      try {
        setRenderError('');
        setRenderedSvg('');
        diagramRef.current.innerHTML = '';

        const renderId = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const diagramDiv = document.createElement('div');
        diagramDiv.className = styles.diagram;
        diagramRef.current.appendChild(diagramDiv);

        const result = await mermaid.render(renderId, schema);
        if (!cancelled) {
          diagramDiv.innerHTML = result.svg;
          const svg = diagramDiv.querySelector('svg');
          if (svg) {
            svg.style.maxWidth = 'none';
            svg.style.width = '1400px';
            svg.style.height = 'auto';
          }
          setRenderedSvg(result.svg);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Mermaid render error:', error);
          setRenderError(error?.message || 'Не удалось отрисовать диаграмму Mermaid');
        }
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [schema, viewMode]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button
          className={`${styles.toolbarButton} ${viewMode === 'diagram' ? styles.active : ''}`}
          onClick={() => setViewMode('diagram')}
        >
          Диаграмма
        </button>
        <button
          className={`${styles.toolbarButton} ${viewMode === 'code' ? styles.active : ''}`}
          onClick={() => setViewMode('code')}
        >
          Код схемы
        </button>
        {viewMode === 'diagram' && renderedSvg && !renderError && (
          <button className={styles.downloadButton} onClick={handleDownloadPng}>
            Скачать PNG
          </button>
        )}
      </div>

      <div className={styles.content}>
        {viewMode === 'diagram' ? (
          <div ref={diagramRef} className={styles.diagramContainer}>
            {!schema && <p className={styles.placeholder}>Нет данных для отображения</p>}
            {renderError && <p className={styles.placeholder}>{renderError}</p>}
          </div>
        ) : (
          <pre className={styles.codeBlock}>{schema || '// Нет данных для отображения'}</pre>
        )}
      </div>
    </div>
  );
};

export default SchemaViewer;
