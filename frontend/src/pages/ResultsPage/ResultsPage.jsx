import React, { useState, useEffect } from 'react';
import SchemaViewer from '../../components/SchemaViewer';
import styles from './ResultsPage.module.css';

const tryParseJson = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeMermaidCode = (code) => {
  if (typeof code !== 'string') {
    return '';
  }

  let normalized = code.trim();
  normalized = normalized.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  normalized = normalized.replace(/\r\n/g, '\n');

  if ((normalized.startsWith('"') && normalized.endsWith('"')) || (normalized.startsWith("'") && normalized.endsWith("'"))) {
    normalized = normalized.slice(1, -1);
  }

  normalized = normalized.replace(/""/g, '"');
  return normalized;
};

const normalizeResultPayload = (raw) => {
  let payload = raw;

  payload = tryParseJson(payload);
  payload = tryParseJson(payload);

  if (typeof payload === 'string' && payload.includes('""')) {
    const repaired = payload.replace(/""/g, '"');
    payload = tryParseJson(repaired);
  }

  if (payload && typeof payload === 'object' && typeof payload.result === 'string') {
    const nested = tryParseJson(payload.result);
    if (nested && typeof nested === 'object') {
      payload = nested;
    }
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return {
    ...payload,
    mermaidCode: normalizeMermaidCode(payload.mermaidCode)
  };
};

const ResultsPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedResults = sessionStorage.getItem('uploadResult');

    if (!savedResults) {
      setError('Нет сохранённых результатов. Загрузите файл на главной странице.');
      setLoading(false);
      return;
    }

    try {
      const normalized = normalizeResultPayload(savedResults);
      if (!normalized) {
        throw new Error('Некорректный формат данных результата');
      }
      setResults(normalized);
    } catch (e) {
      console.error('Ошибка чтения результатов из sessionStorage:', e);
      setError('Не удалось загрузить результаты. Попробуйте загрузить файл заново.');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.noData}>Загрузка результатов...</div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className={styles.container}>
        <div className={styles.noData}>
          {error || 'Нет данных для отображения'}
        </div>
      </div>
    );
  }

  const { title, description, mermaidCode } = results;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {title || 'Результат обработки документа'}
        </h1>
      </div>

      <div className={styles.content}>
        {description && (
          <div className={styles.descriptionCard}>
            <h2>Описание</h2>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {description}
            </p>
          </div>
        )}

        <div className={styles.schemaContainer}>
          <h2>Процесс (схема)</h2>
          {mermaidCode ? (
            <SchemaViewer schema={mermaidCode} type="flowchart" />
          ) : (
            <div className={styles.noData}>
              Схема не была сгенерирована или отсутствует в ответе
            </div>
          )}
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <button
            className={styles.secondaryButton}
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Загрузить другой документ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
