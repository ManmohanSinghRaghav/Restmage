import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider, Box, Typography
} from '@mui/material';
import {
<<<<<<< HEAD
  Dashboard as DashboardIcon, Add as AddIcon,
  TrendingUp, Chat as ChatIcon, Architecture
=======
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Home as FloorPlanIcon,
  AttachMoney as PriceIcon,
  Chat as ChatIcon,
  Edit as EditorIcon,
>>>>>>> 93af25bc042d533010d982d8d0fd4e6fa273aca1
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'New Project', icon: <AddIcon />, path: '/project/new' },
];

const toolItems = [
  { text: 'Floor Plan Generator', icon: <Architecture />, path: '/floorplan' },
  { text: 'Price Prediction', icon: <TrendingUp />, path: '/price-prediction' },
  { text: 'AI Chatbot', icon: <ChatIcon />, path: '/chatbot' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

<<<<<<< HEAD
  const handleNav = (path: string) => { navigate(path); onClose(); };
=======
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Floor Plan Generator',
      icon: <FloorPlanIcon />,
      path: '/floorplan',
    },
    {
      text: 'Floor Plan Editor',
      icon: <EditorIcon />,
      path: '/map-editor',
    },
    {
      text: 'Price Prediction',
      icon: <PriceIcon />,
      path: '/price-prediction',
    },
    {
      text: 'AI Chatbot',
      icon: <ChatIcon />,
      path: '/chatbot',
    },
    {
      text: 'New Project',
      icon: <AddIcon />,
      path: '/project/new/edit',
    },
  ];
>>>>>>> 93af25bc042d533010d982d8d0fd4e6fa273aca1

  const NavItem = ({ item }: { item: { text: string; icon: React.ReactElement; path: string } }) => {
    const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    return (
      <ListItem disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton
          selected={active}
          onClick={() => handleNav(item.path)}
          sx={{
            borderRadius: 2, mx: 1,
            '&.Mui-selected': {
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              color: 'primary.main',
              '& .MuiListItemIcon-root': { color: 'primary.main' },
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 700 : 400 }} />
        </ListItemButton>
      </ListItem>
    );
  };

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>REST✨MAGE</Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ flex: 1, py: 1 }}>
        <List>
          {menuItems.map(item => <NavItem key={item.path} item={item} />)}
        </List>
        <Divider sx={{ my: 1, mx: 2 }} />
        <Typography variant="overline" color="text.disabled" sx={{ px: 3, py: 1, display: 'block' }}>
          AI Tools
        </Typography>
        <List>
          {toolItems.map(item => <NavItem key={item.path} item={item} />)}
        </List>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH } }}
    >
      {content}
    </Drawer>
  );
};

export default Sidebar;