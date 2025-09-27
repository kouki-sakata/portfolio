import { useContext } from 'react';
import { ThemeContext } from './theme-context';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  // Fixed: Remove unnecessary conditional that was always falsy
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};