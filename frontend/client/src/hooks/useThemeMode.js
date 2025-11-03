import { useState } from 'react';
import useLocalStorage from './useLocalStorage';

const useThemeMode = () => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
};

export default useThemeMode;
