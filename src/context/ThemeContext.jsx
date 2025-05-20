import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // Default to dark mode
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: {
      background: isDarkMode ? '#0d1117' : '#f8f9fa',
      card: isDarkMode ? '#161b22' : '#ffffff',
      text: {
        primary: isDarkMode ? '#e6edf3' : '#1a1a1a',
        secondary: isDarkMode ? '#8b949e' : '#666666',
      },
      border: isDarkMode ? '#30363d' : '#e1e4e8',
      accent: '#58a6ff',
      button: {
        primary: '#58a6ff',
        hover: '#58a6ff90',
      },
      input: {
        background: isDarkMode ? '#0d1117' : '#ffffff',
        border: isDarkMode ? '#30363d' : '#e1e4e8',
        text: isDarkMode ? '#e6edf3' : '#1a1a1a',
      },
      progress: {
        background: isDarkMode ? '#30363d' : '#e1e4e8',
        fill: '#58a6ff',
      },
    },
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}; 