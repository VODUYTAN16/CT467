import React, { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import { AppBar, Toolbar, Typography, Button, Link, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const drawerWidth = 240;

const Navbar = ({ handleDrawerToggle }) => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation(); // Initialize useTranslation

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link component={RouterLink} to="/dashboard" color="inherit" sx={{ textDecoration: 'none' }}>
            {t('common.app_name')} {/* Use translated app name */}
          </Link>
        </Typography>
        {
          user ? (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>{t('common.hello')}, {user.username}</Typography>
              <LanguageSwitcher />
              <ThemeToggle />
              <Button color="inherit" onClick={logout}>{t('navbar.logout')}</Button>
            </>
          ) : (
            <Button color="inherit" component={RouterLink} to="/login">{t('navbar.login')}</Button>
          )
        }
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
