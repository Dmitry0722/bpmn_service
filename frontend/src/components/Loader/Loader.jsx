import React from 'react';
import styles from './Loader.module.css';

const Loader = ({ text = 'Загрузка...' }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.spinner}></div>
        <p className={styles.text}>{text}</p>
      </div>
    </div>
  );
};

export default Loader;