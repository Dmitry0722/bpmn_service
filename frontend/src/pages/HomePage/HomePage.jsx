import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../../components/FileUpload';
import styles from './HomePage.module.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [fileUploaded, setFileUploaded] = useState(false);

  const handleUploadSuccess = (result) => {
    sessionStorage.setItem('uploadResult', JSON.stringify(result));
    setFileUploaded(true);
    setTimeout(() => {
      navigate('/results');
    }, 1500);
  };

  const infoCards = [
    {
      id: 'stories',
      icon: '📝',
      title: 'User Stories',
      description: 'Короткие формулировки от лица пользователя',
      example: '"Как [роль], я хочу [действие], чтобы [цель]"',
      color: 'linear-gradient(90deg, #2ecc71, #27ae60)'
    },
    {
      id: 'usecases',
      icon: '🔄',
      title: 'Use Cases',
      description: 'Детальные сценарии с акторами, условиями и потоками событий',
      example: 'Актор: Пользователь → Предусловие → Основной поток → Постусловие',
      color: 'linear-gradient(90deg, #f39c12, #e67e22)'
    },
    {
      id: 'schema',
      icon: '📊',
      title: 'UML/BPMN схемы',
      description: 'Визуальное представление архитектуры',
      example: 'Диаграммы последовательностей, активностей, классов',
      color: 'linear-gradient(90deg, #9b59b6, #8e44ad)'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          AI Requirements Generator
        </h1>
        <p className={styles.subtitle}>
          Загрузите техническое задание, и мы поможем структурировать требования
        </p>
      </div>

      <div className={styles.mainContent}>
        {/* Левая колонка - информационные карточки */}
        <div className={styles.infoColumn}>
          {infoCards.map((card) => (
            <div 
              key={card.id}
              className={styles.infoCard}
              style={{ '--card-color': card.color }}
            >
              <div className={styles.infoCardIconWrapper}>
                <span>{card.icon}</span>
              </div>
              <div className={styles.infoCardContent}>
                <h3 className={styles.infoCardTitle}>{card.title}</h3>
                <p className={styles.infoCardDescription}>{card.description}</p>
                <div className={styles.infoCardExample}>{card.example}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Правая колонка - загрузка файла */}
        <div className={styles.uploadColumn}>
          <div className={styles.uploadCard}>
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>
          
          {!fileUploaded && (
            <div className={styles.hintCard}>
              <div className={styles.hintIcon}>💡</div>
              <div className={styles.hintText}>
                <strong>Поддерживаются форматы:</strong> PDF, DOCX, TXT (до 10MB)
              </div>
            </div>
          )}

          {fileUploaded && (
            <div className={styles.hintCard} style={{ background: 'rgba(46, 204, 113, 0.1)' }}>
              <div className={styles.hintIcon}>✅</div>
              <div className={styles.hintText}>
                <strong>Файл загружен!</strong> Перенаправляем на страницу результатов...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;