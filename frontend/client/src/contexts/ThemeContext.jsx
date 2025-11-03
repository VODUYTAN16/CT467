import { createContext, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import useThemeMode from '../hooks/useThemeMode';
import palette from '../theme/palette';
import typography from '../theme/typography';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { theme, toggleTheme } = useThemeMode();

  const muiTheme = useMemo(() => createTheme({
    palette: palette[theme],
    typography,
  }), [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
