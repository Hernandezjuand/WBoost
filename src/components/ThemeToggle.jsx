import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const theme = useTheme();

  return (
    <button
      onClick={theme.toggleTheme}
      className="p-2 rounded-md transition-colors hover:bg-opacity-10"
      style={{
        backgroundColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        color: theme.colors.text.primary
      }}
    >
      {theme.isDarkMode ? '🌞' : '🌙'}
    </button>
  );
};

export default ThemeToggle; 