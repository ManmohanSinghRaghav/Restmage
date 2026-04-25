import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { ThemeName, getTheme } from '../theme';

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProviderWrapper');
  }
  return context;
};

interface ThemeProviderWrapperProps {
  children: ReactNode;
}

export const ThemeProviderWrapper: React.FC<ThemeProviderWrapperProps> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<ThemeName>(() => {
    const savedTheme = localStorage.getItem('restmage_theme') as ThemeName;
    return savedTheme || 'midnight'; // Default to the premium Midnight Glass theme
  });

  const setTheme = (theme: ThemeName) => {
    setCurrentThemeState(theme);
    localStorage.setItem('restmage_theme', theme);
  };

  const theme = getTheme(currentTheme);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      <MUIThemeProvider theme={theme}>
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
