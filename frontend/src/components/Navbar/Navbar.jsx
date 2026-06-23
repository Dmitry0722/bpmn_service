import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>✨</span>
          AI Requirements Generator
        </Link>
        <ul className={styles.navLinks}>
          <li>
            <Link 
              to="/" 
              className={`${styles.link} ${location.pathname === '/' ? styles.active : ''}`}
            >
              Главная
            </Link>
          </li>
          <li>
            <Link 
              to="/results" 
              className={`${styles.link} ${location.pathname === '/results' ? styles.active : ''}`}
            >
              Результаты
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;