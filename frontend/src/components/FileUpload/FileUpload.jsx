import React, { useState, useCallback } from 'react';
import styles from './FileUpload.module.css';
import { uploadFile, checkStatus, getResults } from '../../services/api';
import { validateFile } from '../../utils/fileHelpers';
import Loader from '../Loader';

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

const pollTaskStatus = async (taskId) => {
  const MAX_TIMEOUT = 900000;     // 15 минут
  const POLL_INTERVAL = 30000;     // опрашиваем каждые 30 секунд

  return new Promise((resolve, reject) => {
    let intervalId;

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      reject(new Error('Время ожидания обработки задачи истекло (15 минут)'));
    }, MAX_TIMEOUT);

    intervalId = setInterval(async () => {
      try {
        const statusData = await checkStatus(taskId);
        const status = statusData.status;

        if (status === 'success') {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          const result = await getResults(taskId);
          resolve(result);
        } else if (status === 'failure') {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          const errMsg = statusData.error || statusData.message || 'Ошибка обработки задачи';
          reject(new Error(errMsg));
        }
        // pending — продолжаем опрос
      } catch (pollErr) {
        console.error('Ошибка проверки статуса:', pollErr);
        // продолжаем при временных сетевых сбоях
      }
    }, POLL_INTERVAL);
  });
};

  const handleFile = useCallback((selectedFile) => {
    setError('');
    const validation = validateFile(selectedFile);
    
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setFile(selectedFile);
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }, [handleFile]);

  const handleFileSelect = useCallback((e) => {
    const selectedFile = e.target.files[0];
    handleFile(selectedFile);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const uploadResponse = await uploadFile(file);
      
      if (!uploadResponse.task_id) {
        throw new Error('Сервер не вернул ID задачи');
      }

      const taskId = uploadResponse.task_id;
      const finalResult = await pollTaskStatus(taskId); 

      onUploadSuccess(finalResult);
    } catch (err) {
      setError(err.message || 'Ошибка при обработке файла');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
  };

  return (
    <div className={styles.container}>
      <div 
        className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''} ${file ? styles.hasFile : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="fileInput"
          className={styles.fileInput}
          onChange={handleFileSelect}
          accept=".txt,.doc,.docx,.pdf"
        />
        
        {!file ? (
          <label htmlFor="fileInput" className={styles.label}>
            <div className={styles.icon}>📄</div>
            <p className={styles.text}>
              Перетащите файл сюда или <span className={styles.browse}>выберите файл</span>
            </p>
            <p className={styles.hint}>Поддерживаются форматы: TXT, DOC, DOCX, PDF</p>
          </label>
        ) : (
          <div className={styles.fileInfo}>
            <div className={styles.fileDetails}>
              <span className={styles.fileIcon}>📄</span>
              <div className={styles.fileMeta}>
                <p className={styles.fileName}>{file.name}</p>
                <p className={styles.fileSize}>
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button 
              className={styles.removeButton}
              onClick={handleRemoveFile}
              type="button"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {file && !loading && (
        <button 
          className={styles.uploadButton}
          onClick={handleUpload}
        >
          Загрузить и обработать
        </button>
      )}

      {loading && <Loader text="Обработка файла на сервере... (ожидание результата)" />}
    </div>
  );
};

export default FileUpload;