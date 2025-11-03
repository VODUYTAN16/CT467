import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { IconButton, Menu, MenuItem } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage } = useContext(LanguageContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    handleClose();
  };

  return (
    <>
      <IconButton
        aria-label="language-switcher"
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        color="inherit"
      >
        <TranslateIcon />
      </IconButton>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-switcher',
        }}
      >
        <MenuItem onClick={() => handleLanguageChange('en')} selected={currentLanguage === 'en'}>
          English
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('vi')} selected={currentLanguage === 'vi'}>
          Tiếng Việt
        </MenuItem>
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
