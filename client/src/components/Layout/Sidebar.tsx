import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Map as MapIcon,
  Home as FloorPlanIcon,
  AttachMoney as PriceIcon,
  Chat as ChatIcon,
  EditLocation as MapEditorIcon,
  Edit as EditorIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
      text: 'Map Editor',
      icon: <MapEditorIcon />,
      path: '/map-editor',
    },
    {
      text: 'Floor Plan Editor',
      icon: <EditorIcon />,
      path: '/editor',
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
      text: 'Map View',
      icon: <MapIcon />,
      path: '/maps',
    },
    {
      text: 'New Project',
      icon: <AddIcon />,
      path: '/project/new/edit',
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const drawerContent = (
    <>
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;