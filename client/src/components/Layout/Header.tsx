import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
} from '@mui/material';
import { Menu as MenuIcon, Palette as PaletteIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { ThemeName } from '../../theme';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const { currentTheme, setTheme } = useThemeContext();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [themeAnchorEl, setThemeAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    showNotification('Logged out successfully', 'info');
    handleClose();
  };

  const handleThemeMenu = (event: React.MouseEvent<HTMLElement>) => {
    setThemeAnchorEl(event.currentTarget);
  };

  const handleThemeClose = () => {
    setThemeAnchorEl(null);
  };

  const handleThemeSelect = (themeName: ThemeName) => {
    setTheme(themeName);
    handleThemeClose();
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: 1 }}>
          REST✨MAGE
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <IconButton color="inherit" onClick={handleThemeMenu} title="Change Theme">
            <PaletteIcon />
          </IconButton>
          <Menu
            anchorEl={themeAnchorEl}
            open={Boolean(themeAnchorEl)}
            onClose={handleThemeClose}
          >
            <MenuItem selected={currentTheme === 'arctic'} onClick={() => handleThemeSelect('arctic')}>Arctic Minimal</MenuItem>
            <MenuItem selected={currentTheme === 'midnight'} onClick={() => handleThemeSelect('midnight')}>Midnight Glass</MenuItem>
            <MenuItem selected={currentTheme === 'solar'} onClick={() => handleThemeSelect('solar')}>Solar Flare</MenuItem>
            <MenuItem selected={currentTheme === 'forest'} onClick={() => handleThemeSelect('forest')}>Forest Serenity</MenuItem>
            <MenuItem selected={currentTheme === 'cyberpunk'} onClick={() => handleThemeSelect('cyberpunk')}>Cyberpunk</MenuItem>
          </Menu>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1, fontWeight: 500 }}>
              {user.username}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;