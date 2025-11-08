import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';
import { NotificationContextType } from '../types';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: AlertColor;
  }>({
    open: false,
    message: '',
    type: 'info',
  });

  const showNotification = (message: string, type: AlertColor = 'info') => {
    setNotification({
      open: true,
      message,
      type,
    });
  };

  const handleClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const value: NotificationContextType = {
    showNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={notification.type} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};